import React, { Suspense, memo, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface SofiaAvatar3DProps {
  mouthOpen: number;
  isSpeaking: boolean;
}

interface AvatarModelProps {
  mouthOpen: number;
  isSpeaking: boolean;
}

const READY_PLAYER_ME_MODEL_URL = 'https://models.readyplayer.me/6996ded0d9645a11b168ace8.glb';

interface MorphBinding {
  mesh: THREE.Mesh;
  index: number;
  weight: number;
}

const getMorphWeight = (morphName: string): number => {
  const name = morphName.toLowerCase();
  if (name.includes('jawopen') || name.includes('mouthopen')) return 1;
  if (name.includes('viseme_aa') || name.includes('viseme_oh')) return 0.95;
  if (name.includes('viseme')) return 0.75;
  if (name.includes('mouth')) return 0.6;
  return 0.5;
};

const isRoundMouthMorph = (morphName: string): boolean => {
  return /(viseme_oh|viseme_o|viseme_u|mouthpucker|mouthfunnel|mouthshrug|mouthroll)/.test(morphName);
};

const getRoundMorphWeight = (morphName: string): number => {
  if (morphName.includes('viseme_oh') || morphName.includes('viseme_o')) return 1;
  if (morphName.includes('mouthpucker') || morphName.includes('mouthfunnel')) return 0.9;
  if (morphName.includes('viseme_u')) return 0.8;
  return 0.65;
};

const AvatarModel: React.FC<AvatarModelProps> = ({ mouthOpen, isSpeaking }) => {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useLoader(GLTFLoader, READY_PLAYER_ME_MODEL_URL);
  const baseYRef = useRef(-3);

  const jawRef = useRef<THREE.Bone | null>(null);
  const headRef = useRef<THREE.Bone | null>(null);
  const cameraWorldRef = useRef(new THREE.Vector3());
  const headLocalCameraRef = useRef(new THREE.Vector3());

  const smoothMouthRef = useRef(0);

  const { scene, mouthMorphs, roundMouthMorphs } = useMemo(() => {
    const modelScene = gltf.scene;
    const mouth: MorphBinding[] = [];
    const roundMouth: MorphBinding[] = [];

    modelScene.traverse((node) => {
      const object3D = node as THREE.Object3D;

      if ((object3D as THREE.Bone).isBone) {
        const bone = object3D as THREE.Bone;
        const lowerName = bone.name.toLowerCase();

        if (!jawRef.current && /(jaw|chin|mandible)/i.test(lowerName)) {
          jawRef.current = bone;
        }

        if (!headRef.current && /(head|neck)/i.test(lowerName)) {
          headRef.current = bone;
        }
      }

      if (!(object3D as THREE.Mesh).isMesh) return;

      const mesh = object3D as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;

      Object.entries(mesh.morphTargetDictionary).forEach(([morphName, index]) => {
        const lowerName = morphName.toLowerCase();

        if (isRoundMouthMorph(lowerName)) {
          roundMouth.push({ mesh, index, weight: getRoundMorphWeight(lowerName) });
          return;
        }

        if (/(viseme|mouth|jawopen|mouthopen)/.test(lowerName) && !/(smile|frown|blink|brow|eye|pucker|funnel|roll|shrug)/.test(lowerName)) {
          mouth.push({ mesh, index, weight: getMorphWeight(lowerName) });
        }
      });
    });

    return {
      scene: modelScene,
      mouthMorphs: mouth,
      roundMouthMorphs: roundMouth,
    };
  }, [gltf.scene]);

  useFrame(({ clock, camera }) => {
    const time = clock.elapsedTime;

    const targetMouth = Math.min(1, Math.max(0, mouthOpen)) * (isSpeaking ? 1 : 0.7);
    const mouthResponse = targetMouth > smoothMouthRef.current ? 0.62 : 0.3;
    smoothMouthRef.current = THREE.MathUtils.lerp(smoothMouthRef.current, targetMouth, mouthResponse);

    if (groupRef.current) {
      const breathingDepth = isSpeaking ? 0.012 : 0.009;
      const breathing = Math.sin(time * 1.45) * breathingDepth;
      const torsoSway = Math.sin(time * 0.72) * 0.006;

      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        baseYRef.current + breathing,
        0.12
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, torsoSway, 0.1);
    }

    if (jawRef.current) {
      const desiredJawRotation = -0.03 - smoothMouthRef.current * 0.62;
      jawRef.current.rotation.x = THREE.MathUtils.lerp(jawRef.current.rotation.x, desiredJawRotation, 0.52);
    }

    if (headRef.current) {
      const headParent = headRef.current.parent;
      if (headParent) {
        camera.getWorldPosition(cameraWorldRef.current);
        headLocalCameraRef.current.copy(cameraWorldRef.current);
        headParent.worldToLocal(headLocalCameraRef.current);

        const targetYaw = THREE.MathUtils.clamp(
          Math.atan2(headLocalCameraRef.current.x, Math.max(0.001, headLocalCameraRef.current.z)),
          -0.45,
          0.45
        );
        const targetPitch = THREE.MathUtils.clamp(
          Math.atan2(headLocalCameraRef.current.y, Math.max(0.001, headLocalCameraRef.current.z)),
          -0.28,
          0.22
        );

        const naturalTurn = Math.sin(time * 0.42) * 0.012;
        const naturalNod = Math.sin(time * 0.95 + 0.35) * 0.01;
        const naturalTilt = Math.sin(time * 0.58 + 1.1) * 0.008;

        const desiredHeadY = targetYaw * 0.84 + naturalTurn;
        const desiredHeadX = -targetPitch * 0.55 + naturalNod;
        const desiredHeadZ = naturalTilt;

        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, desiredHeadY, 0.16);
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, desiredHeadX, 0.16);
        headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, desiredHeadZ, 0.14);
      }
    }

    mouthMorphs.forEach(({ mesh, index, weight }) => {
      const current = mesh.morphTargetInfluences?.[index] ?? 0;
      const desired = smoothMouthRef.current * weight;
      if (mesh.morphTargetInfluences) {
        mesh.morphTargetInfluences[index] = THREE.MathUtils.lerp(current, desired, 0.5);
      }
    });

    const roundShapeTarget = isSpeaking
      ? THREE.MathUtils.smoothstep(smoothMouthRef.current, 0.16, 0.78) * 1.1
      : 0;

    roundMouthMorphs.forEach(({ mesh, index, weight }) => {
      const current = mesh.morphTargetInfluences?.[index] ?? 0;
      const desired = roundShapeTarget * weight;
      if (mesh.morphTargetInfluences) {
        mesh.morphTargetInfluences[index] = THREE.MathUtils.lerp(current, desired, 0.56);
      }
    });

  });

  return (
    <group ref={groupRef} position={[0, -3, 0]} scale={[2, 2, 2]}>
      <primitive object={scene} />
    </group>
  );
};

const SofiaAvatar3D: React.FC<SofiaAvatar3DProps> = ({ mouthOpen, isSpeaking }) => {
  return (
    <div className="w-full max-w-[520px] aspect-[4/5]">
      <Canvas shadows camera={{ position: [0, 1.45, 2.2], fov: 29 }}>
        <color attach="background" args={['#ffffff']} />
        <ambientLight intensity={0.95} />
        <directionalLight position={[2.5, 3.2, 2.2]} intensity={1.35} castShadow />
        <directionalLight position={[-2.2, 1.8, 1.2]} intensity={0.55} />
        <Suspense fallback={null}>
          <AvatarModel mouthOpen={mouthOpen} isSpeaking={isSpeaking} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default memo(SofiaAvatar3D);