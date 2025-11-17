import { Object3DNode, extend } from "react-three-fiber";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import roboto from "@/assets/roboto.json"

extend({TextGeometry})

declare module "@react-three/fiber" {
    interface ThreeElements {
      textGeometry: Object3DNode<TextGeometry, typeof TextGeometry>;
    }
  }

export function Text(){
    const font = new FontLoader().parse(roboto)

    return (
        <mesh>
            <textGeometry args={['abcd', {font, size:10, height:1, bevelEnabled:false}]}/>
        </mesh>
    )
}