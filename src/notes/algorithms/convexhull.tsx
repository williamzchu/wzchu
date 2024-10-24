import { Canvas } from "@react-three/fiber"
import HullVisual from "./hullvisual"
import { useRef } from "react"

export default function ConvexHull(){

    return (
<div>
<p>
The convex hull is essentially a shape that surrounds a group of points, where the shape is as small as it can be. 
It can be thought of taking a bunch of points, and wrapping a rubber bound around all these points and obtaining the resultant shape.
Convex hulls have applications throughout mathematics, statistics, and even physics. However, perhaps the most interesting ones (to me) would definitely be applications in computers, graphics, and geometry.
</p>

<p>
Because of it's vast variety of applications, we would like to compute the convex hull of a set of points.
Perhaps one simple yet effective one is known as "Graham's Algorithm." 
</p>

<button>Hull</button>

<div style={{borderStyle: "solid", borderColor: "white", borderWidth: "5px", height: "50vh"}}>
    <Canvas >
        <HullVisual/>
    </Canvas>
</div>

</div>
    )
}