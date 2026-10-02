import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { EventNode, DependencyEdge, BlastRadiusReport } from '../../types';
import { 
  RotateCw, 
  Eye, 
  Sparkles, 
  Play
} from 'lucide-react';

interface ThreeGraphCanvasProps {
  nodes: EventNode[];
  edges: DependencyEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  disruptionTriggerTime: number;
  report?: BlastRadiusReport;
  selectedNodeDetails?: {
    trigger: string;
    requiredBuffer: string;
    availableBuffer: string;
    result: string;
    causeType: string;
  } | null;
  isPresentationMode?: boolean;
}

const NODE_POSITIONS: Record<string, [number, number, number]> = {
  'evt-1-flight-nag-del': [-16, 2.2, 0],
  'evt-2-flight-del-bom': [-9, -0.5, 0.4],
  'evt-3-transfer-airport-hotel': [-2, -2.5, -0.3],
  'evt-4-hotel-checkin': [5, 2.2, 0.8],
  'evt-5-client-meeting': [12, -0.2, -0.4],
  'evt-6-workshop': [19, -2.2, 0],
};

const CASCADE_PHASES = [
  { step: 1, id: 'evt-1-flight-nag-del', label: 'PHASE 1: NAG → DEL DISRUPTED (+120m)' },
  { step: 2, id: 'evt-2-flight-del-bom', label: 'PHASE 2: DEL → BOM CONNECTION BROKEN (-105m buffer)' },
  { step: 3, id: 'evt-3-transfer-airport-hotel', label: 'PHASE 3: AIRPORT TRANSFER INVALIDATED' },
  { step: 4, id: 'evt-4-hotel-checkin', label: 'PHASE 4: HOTEL CHECK-IN AT RISK' },
  { step: 5, id: 'evt-5-client-meeting', label: 'PHASE 5: CLIENT MEETING (18:00) BROKEN' },
  { step: 6, id: 'evt-6-workshop', label: 'PHASE 6: DAY 2 WORKSHOP PROTECTED (SAFE)' },
];

export const ThreeGraphCanvas: React.FC<ThreeGraphCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  disruptionTriggerTime,
  report,
  selectedNodeDetails,
  isPresentationMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [activeCascadePhase, setActiveCascadePhase] = useState<number>(0);
  const [isCascading, setIsCascading] = useState<boolean>(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const nodeMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const edgeMeshesRef = useRef<Map<string, { curve: THREE.QuadraticBezierCurve3; tube: THREE.Mesh; particles: THREE.Points }>>(new Map());
  const rippleWavesRef = useRef<Array<{ mesh: THREE.Mesh; progress: number; maxRadius: number; speed: number }>>([]);
  const animFrameIdRef = useRef<number>(0);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'BROKEN':
        return { hex: 0xef4444, css: '#ef4444', glow: 0xdc2626 };
      case 'AT_RISK':
        return { hex: 0xf59e0b, css: '#f59e0b', glow: 0xd97706 };
      case 'SAFE':
      default:
        return { hex: 0x10b981, css: '#10b981', glow: 0x059669 };
    }
  }, []);

  const createNodeMesh = useCallback((node: EventNode): THREE.Group => {
    const group = new THREE.Group();
    group.name = node.id;
    const colors = getStatusColor(node.status);

    let coreGeom: THREE.BufferGeometry;
    switch (node.type) {
      case 'FLIGHT':
        coreGeom = new THREE.OctahedronGeometry(1.6, 1);
        break;
      case 'CONNECTION':
        coreGeom = new THREE.TorusGeometry(1.3, 0.45, 16, 32);
        break;
      case 'TRANSFER':
        coreGeom = new THREE.ConeGeometry(1.4, 2.2, 8);
        break;
      case 'HOTEL':
        coreGeom = new THREE.CylinderGeometry(1.2, 1.4, 2.4, 6);
        break;
      case 'MEETING':
        coreGeom = new THREE.IcosahedronGeometry(1.7, 0);
        break;
      case 'WORKSHOP':
      default:
        coreGeom = new THREE.DodecahedronGeometry(1.7, 0);
        break;
    }

    const coreMat = new THREE.MeshStandardMaterial({
      color: colors.hex,
      emissive: colors.hex,
      emissiveIntensity: node.status === 'BROKEN' ? 0.65 : node.status === 'AT_RISK' ? 0.45 : 0.3,
      metalness: 0.3,
      roughness: 0.25,
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    coreMesh.name = 'core';
    group.add(coreMesh);

    const wireMat = new THREE.MeshBasicMaterial({
      color: colors.glow,
      wireframe: true,
      transparent: true,
      opacity: node.status === 'BROKEN' ? 0.85 : 0.5,
    });
    const wireMesh = new THREE.Mesh(coreGeom, wireMat);
    wireMesh.scale.set(1.2, 1.2, 1.2);
    wireMesh.name = 'wire';
    group.add(wireMesh);

    const haloGeom = new THREE.RingGeometry(2.1, 2.4, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: colors.glow,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: node.status === 'BROKEN' ? 0.9 : 0.55,
    });
    const haloMesh = new THREE.Mesh(haloGeom, haloMat);
    haloMesh.rotation.x = Math.PI / 2;
    haloMesh.name = 'halo';
    group.add(haloMesh);

    return group;
  }, [getStatusColor]);

  const triggerRippleWave = useCallback((nodeId = 'evt-1-flight-nag-del') => {
    if (!sceneRef.current) return;
    
    const [x, y, z] = NODE_POSITIONS[nodeId] || [-16, 2.2, 0];
    const ringGeom = new THREE.RingGeometry(0.2, 1.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, y, z);
    sceneRef.current.add(ring);

    rippleWavesRef.current.push({
      mesh: ring,
      progress: 0,
      maxRadius: 36,
      speed: 0.35,
    });
  }, []);

  // Sequential Cascade Replay Runner
  const runSequentialCascade = useCallback(() => {
    setIsCascading(true);
    setActiveCascadePhase(1);
    onSelectNode('evt-1-flight-nag-del');
    triggerRippleWave('evt-1-flight-nag-del');

    let currentStep = 1;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep <= 6) {
        setActiveCascadePhase(currentStep);
        const nextNode = CASCADE_PHASES[currentStep - 1];
        if (nextNode) {
          onSelectNode(nextNode.id);
          triggerRippleWave(nextNode.id);
        }
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsCascading(false);
          setActiveCascadePhase(0);
        }, 1200);
      }
    }, 600);
  }, [onSelectNode, triggerRippleWave]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    scene.fog = new THREE.FogExp2(0x090d16, 0.015);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 8, 38);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 75;
    controls.minDistance = 12;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight1.position.set(20, 30, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x6366f1, 1.2);
    dirLight2.position.set(-20, -10, -15);
    scene.add(dirLight2);

    // Dark architectural spatial grid floor
    const gridHelper = new THREE.GridHelper(80, 40, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -4;
    scene.add(gridHelper);

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      nodeMeshesRef.current.forEach((group) => {
        const core = group.getObjectByName('core');
        const wire = group.getObjectByName('wire');
        const halo = group.getObjectByName('halo');
        if (core) core.rotation.y = elapsedTime * 0.4;
        if (wire) wire.rotation.y = -elapsedTime * 0.3;
        if (halo) halo.rotation.z = elapsedTime * 0.2;
      });

      edgeMeshesRef.current.forEach(({ curve, particles: edgeParticles }) => {
        const posAttr = edgeParticles.geometry.attributes.position as THREE.BufferAttribute;
        const count = posAttr.count;
        for (let i = 0; i < count; i++) {
          const t = ((i / count) + (elapsedTime * 0.25)) % 1;
          const point = curve.getPoint(t);
          posAttr.setXYZ(i, point.x, point.y, point.z);
        }
        posAttr.needsUpdate = true;
      });

      for (let i = rippleWavesRef.current.length - 1; i >= 0; i--) {
        const wave = rippleWavesRef.current[i];
        wave.progress += wave.speed * 0.05;
        const currentScale = 1 + wave.progress * wave.maxRadius;
        wave.mesh.scale.set(currentScale, currentScale, 1);
        (wave.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.95 * (1 - wave.progress));

        if (wave.progress >= 1) {
          scene.remove(wave.mesh);
          wave.mesh.geometry.dispose();
          (wave.mesh.material as THREE.Material).dispose();
          rippleWavesRef.current.splice(i, 1);
        }
      }

      if (controlsRef.current) {
        controlsRef.current.autoRotate = autoRotate;
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
    };
  }, [autoRotate]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    nodeMeshesRef.current.forEach((group) => scene.remove(group));
    nodeMeshesRef.current.clear();

    nodes.forEach((node) => {
      const group = createNodeMesh(node);
      const pos = NODE_POSITIONS[node.id] || [0, 0, 0];
      group.position.set(pos[0], pos[1], pos[2]);

      const isSelected = node.id === selectedNodeId;
      const isHovered = node.id === hoveredNodeId;

      if (isSelected || isHovered) {
        group.scale.set(1.35, 1.35, 1.35);
      } else {
        group.scale.set(1, 1, 1);
      }

      scene.add(group);
      nodeMeshesRef.current.set(node.id, group);
    });

    edgeMeshesRef.current.forEach(({ tube, particles }) => {
      scene.remove(tube);
      scene.remove(particles);
    });
    edgeMeshesRef.current.clear();

    edges.forEach((edge) => {
      const srcPos = NODE_POSITIONS[edge.source];
      const tgtPos = NODE_POSITIONS[edge.target];
      if (!srcPos || !tgtPos) return;

      const p1 = new THREE.Vector3(...srcPos);
      const p2 = new THREE.Vector3(...tgtPos);

      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      mid.y += Math.abs(p2.x - p1.x) * 0.18 + 1.2;

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const tubeGeom = new THREE.TubeGeometry(curve, 32, 0.18, 8, false);

      const edgeColor = edge.isViolated ? 0xef4444 : edge.slackMinutes < 10 ? 0xf59e0b : 0x10b981;

      const tubeMat = new THREE.MeshStandardMaterial({
        color: edgeColor,
        emissive: edgeColor,
        emissiveIntensity: edge.isViolated ? 0.8 : 0.25,
        transparent: true,
        opacity: edge.isViolated ? 0.9 : 0.65,
        roughness: 0.25,
      });
      const tube = new THREE.Mesh(tubeGeom, tubeMat);
      scene.add(tube);

      const particleCount = 14;
      const pGeom = new THREE.BufferGeometry();
      const pPositions = new Float32Array(particleCount * 3);
      pGeom.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

      const pMat = new THREE.PointsMaterial({
        color: edgeColor,
        size: edge.isViolated ? 0.75 : 0.5,
        transparent: true,
        opacity: 0.95,
      });
      const edgeParticles = new THREE.Points(pGeom, pMat);
      scene.add(edgeParticles);

      edgeMeshesRef.current.set(edge.id, { curve, tube, particles: edgeParticles });
    });

  }, [nodes, edges, selectedNodeId, hoveredNodeId, createNodeMesh]);

  useEffect(() => {
    if (disruptionTriggerTime > 0) {
      triggerRippleWave('evt-1-flight-nag-del');
    }
  }, [disruptionTriggerTime, triggerRippleWave]);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!rendererRef.current || !cameraRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const hitGroups: THREE.Group[] = [];
    nodeMeshesRef.current.forEach((group) => hitGroups.push(group));

    const intersects = raycaster.intersectObjects(hitGroups, true);
    if (intersects.length > 0) {
      let topObj: THREE.Object3D | null = intersects[0].object;
      while (topObj && !nodeMeshesRef.current.has(topObj.name)) {
        topObj = topObj.parent;
      }
      if (topObj && nodeMeshesRef.current.has(topObj.name)) {
        setHoveredNodeId(topObj.name);
        return;
      }
    }
    setHoveredNodeId(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!rendererRef.current || !cameraRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const hitGroups: THREE.Group[] = [];
    nodeMeshesRef.current.forEach((group) => hitGroups.push(group));

    const intersects = raycaster.intersectObjects(hitGroups, true);
    if (intersects.length > 0) {
      let topObj: THREE.Object3D | null = intersects[0].object;
      while (topObj && !nodeMeshesRef.current.has(topObj.name)) {
        topObj = topObj.parent;
      }
      if (topObj && nodeMeshesRef.current.has(topObj.name)) {
        onSelectNode(topObj.name);
      }
    }
  };

  const resetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 8, 38);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  return (
    <div ref={containerRef} className={`relative w-full overflow-hidden select-none rounded-3xl border border-slate-800 bg-[#090d16] shadow-xl ${
      isPresentationMode ? 'h-[640px] sm:h-[700px]' : 'h-[500px] sm:h-[550px]'
    }`}>
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Top Floating Nodes Pill Bar & Cascade Phase Banner */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-10">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/80 shadow-md text-xs font-mono-code">
          {nodes.map((n) => {
            const isSelected = selectedNodeId === n.id;
            return (
              <button
                key={n.id}
                onClick={() => onSelectNode(n.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300'
                    : n.status === 'BROKEN'
                    ? 'bg-red-950/80 text-red-300 border border-red-800 hover:bg-red-900'
                    : n.status === 'AT_RISK'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800 hover:bg-amber-900'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <span>{n.title}</span>
              </button>
            );
          })}
        </div>

        {/* Camera HUD Tools & Replay Button */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-700/80 shadow-md">
          <button
            onClick={runSequentialCascade}
            disabled={isCascading}
            title="Replay Cascade"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold font-mono-code shadow-xs transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>REPLAY CASCADE</span>
          </button>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle Auto-Rotation"
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              autoRotate ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => triggerRippleWave('evt-1-flight-nag-del')}
            title="Re-run Disruption Ripple"
            className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            onClick={resetCamera}
            title="Reset View"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Cascade Banner */}
      {isCascading && activeCascadePhase > 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none z-20 animate-fadeIn">
          <div className="px-4 py-2 rounded-2xl bg-indigo-900/90 border border-indigo-500 text-white font-mono-code text-xs font-bold shadow-xl flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span>{CASCADE_PHASES[activeCascadePhase - 1]?.label}</span>
          </div>
        </div>
      )}

      {/* Floating Impact Summary in Upper-Right (Inside Canvas) */}
      {report && (
        <div className="absolute top-20 right-4 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-700/80 shadow-md text-xs font-mono-code z-10">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">BLAST RADIUS</span>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="text-red-400">{report.brokenCount} BROKEN</span>
            <span className="text-slate-500">•</span>
            <span className="text-amber-400">{report.atRiskCount} AT RISK</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400">{report.safeCount} SAFE</span>
          </div>
        </div>
      )}

      {/* Bottom Floating Legend & Cause Trace Panel */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3 pointer-events-none z-10">
        {/* Legend */}
        <div className="flex items-center gap-4 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700/80 pointer-events-auto text-xs font-semibold shadow-md text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>SAFE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>AT RISK</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 font-bold">BROKEN</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono-code text-[11px]">━━ dependency → impact direction</span>
        </div>

        {/* Selected Node Diagnostic Card */}
        {selectedNode && (
          <div className="bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-700/90 text-left pointer-events-auto shadow-xl max-w-sm text-xs font-mono-code text-white">
            <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-800">
              <span className="font-extrabold text-sm text-white font-sans">{selectedNode.title}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                selectedNode.status === 'BROKEN' ? 'bg-red-900 text-red-200' : selectedNode.status === 'AT_RISK' ? 'bg-amber-900 text-amber-200' : 'bg-emerald-900 text-emerald-200'
              }`}>
                {selectedNode.status}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] font-sans leading-relaxed">
              {selectedNode.impactExplanation}
            </p>
            {selectedNodeDetails && (
              <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-0.5">
                <div><strong>Cause:</strong> {selectedNodeDetails.trigger}</div>
                <div><strong>Constraint:</strong> {selectedNodeDetails.causeType}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
