import { Prism } from "@/components/Prism";
import { Canvas, extend, useLoader, useFrame } from "@react-three/fiber";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import roboto from "@/assets/roboto.json"
import { Text } from "@/components/Text";
import { cubeTexture, texture } from "three/examples/jsm/nodes/Nodes.js";
import { Prism2 } from "@/components/Prism2";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CubeCamera, PresentationControls, useEnvironment, OrbitControls, EnvironmentMap, Environment } from "@react-three/drei";
import { Box } from "@/components/Box";

function Scene(){
    const envmap = useEnvironment({files: "/stars.exr"})

    return (
        <>  
            <ambientLight />    
            <OrbitControls/>

            <Environment map={envmap} background />
            
            <CubeCamera resolution={100} position={[0,0,-10]}>
            {/* @ts-ignore */}
            {(texture: THREE.Texture | undefined) =>(
                <>
                    <Environment map={texture}/>
                    <Prism envMap={envmap} position={[0, 0, 10]} ref={undefined}/>
                </>
            )}

            </CubeCamera>
            
            <Box position={[0,0,-55]}>
                <meshStandardMaterial color="red"/>
            </Box>
        </>
    )
}


export default function Home(){
    return (
        <>
        <div className="canvas-container" >
            <Canvas shadows camera={{ zoom: 1.0 }}> 
                <Scene/>
            </Canvas>
            
        </div>
        </>
    )
}