import { Canvas } from "@react-three/fiber"
import HullVisual from "./hullvisual"
import { useEffect, useRef, useState } from "react"
import Code from "../../Code"
import Latex from "../../Latex"

const minCode = `let bottom = points[0]
for (let i = 1; i < points.length; i++){
    const curr = points[i]
    if (curr.position.y < bottom.position.y || curr.position.y == bottom.position.y && curr.position.x < bottom.position.x){
        bottom = curr
    }
}
`

const sortCode = `points.sort(function(a,b){
    const xa_i2 = (a.position.x - bottom.position.x) * (a.position.x - bottom.position.x)
    const ya_i2 = (a.position.y - bottom.position.y) * (a.position.y - bottom.position.y)
    const cos2a = (a.position.x - bottom.position.x) / Math.sqrt(xa_i2 + ya_i2)

    const xb_i2 = (b.position.x - bottom.position.x) * (b.position.x - bottom.position.x)
    const yb_i2 = (b.position.y - bottom.position.y) * (b.position.y - bottom.position.y)
    const cos2b = (b.position.x - bottom.position.x)/ Math.sqrt(xb_i2 + yb_i2)

    return cos2b - cos2a
})
`

const cross = `function cross(a: number[], b: number[], c: number[]){
    return (b[0] - a[0])*(c[1] - a[1]) - (b[1] - a[1])*(c[0] - a[0])
}`

const convex = `stack = []
for (let i = 0; i < points.length; i++){
    while (stack.length > 1 && cross(stack[stack.length - 2], stack[stack.length-1], points[i]) <= 0) {
        stack.pop()
    }
    stack.push(points[i])
}
`

export default function ConvexHull(){
    const hullRef = useRef(null)
    const [viewingSteps, setViewingSteps] = useState(false)
    
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

<button onClick={() => {setViewingSteps(!viewingSteps); viewingSteps? hullRef.current.updateHull() : hullRef.current.steps()}}>{viewingSteps? "Viewing Steps": "Viewing Hull"}</button>
<button onClick={() => hullRef.current.next()} disabled={!viewingSteps}>Next</button>
<button onClick={() => hullRef.current.prev()} disabled={!viewingSteps}>Prev</button>

<div style={{borderStyle: "solid", borderColor: "white", borderWidth: "5px", height: "50vh"}}>
    <Canvas >
        <HullVisual ref={hullRef}/>
    </Canvas>
</div>

<p style={{color: "gray"}}>
    In this demo, add points when "viewing hull" by left clicking empty space. Click the point to remove it. Points are also draggable when "viewing hull." Move the entire scene around by right click dragging. Steps can be seen by "viewing steps."
</p>

<p>
This algorithm essentially boils down to noting that the points on the convex hull will always make a turn in the same direction. For example, when looking at the steps, we note that the points will always make a counter-clockwise turn. If it doesn't we remove that edge that is part of the turn, and instead create an edge that doesn't include that point.
However, there are some smaller details to note.
</p>

<p>
We first start at the bottom most point and left most, which is relatively simple, finding the point with the smallest "y" and "x" coordinate, prioritizing "y" first. For example, this javascript code adapted from my demo.
</p>

<Code>
    {minCode}
</Code>
<p>
Now, we want to be able to go through the points in a clockwise manner, essentially needing to sort the points in some manner. In the case of the Graham scan, we sort according to the angle with our bottom point, or essentially the angle given by the segment from the bottom point with the x-axis. This resulting in being able to process points in a counter-clockwise manner.
However, we actually won't need to use trigonometric functions, and can simply use the dot product. 

<p>
Let <Latex>b</Latex> be the bottom point, and <Latex>x</Latex> be the point we are calculating the angle for, then <Latex>{"\\vec{v} = \\langle x_x-b_x, x_y - b_y \\rangle"}</Latex> is the line from <Latex>b</Latex> to <Latex>x</Latex>.
</p>

<p>
    We can now find the angle between <Latex>{"\\vec{v}"}</Latex> and the x-axis, which we can denote as a unit vector <Latex>{"\\vec{u} = \\langle 1, 0 \\rangle"}</Latex>. 
    Therefore, by using the dot product, we see that <Latex>{"\\cos \\theta = \\frac{\\vec{v} \\cdot \\vec{u}}{|\\vec{v}||\\vec{u}|}"}</Latex>. By computing and implementing it into the code as a sort function, here is the adapted version of the demo.
</p>
<Code>
{sortCode}
</Code>
<p>However, we still note that we need to take a square root which could be expensive. There is similar version of the Graham scan where we instead sort by x-coordinate instead (avoiding the square root), and then perform two computations of the hull, one upper and one lower.</p>

<p>We now need to compute/detect when points make a "counter-clockwise turn." Again, there is no need for trigonometric functions, and this check can be taken from the cross product by simply checking if the z-coordinate is positive. 
    Since we have three points to check the angle, <Latex>a, b, c</Latex>, where <Latex>{"\\vec{v_1} = b - a = \\langle b_x - a_x, b_y - a_y \\rangle"}</Latex>, and <Latex>{"\\vec{v_2} = c - a = \\langle c_x - a_x, c_y - a_y \\rangle"}</Latex>. 
</p>
<p>
Therefore, the the z-coordinate is <Latex>{"\\vec{v_1} \\times \\vec{v_2} = (b_x - a_x)(c_y - a_y) - (b_y - a_y)(c_x - a_x)"}</Latex>.
</p>
<p>Implementation for of this cross is simply copying down the equation:</p>
<Code>
    {cross}
</Code>

<p>{"We can now loop through every point and check if the most recent three points make a counter-clockwise turn. If it is instead colinear or a clockwise turn, (hence checking if the cross product <= 0) then we remove the intermediate point. Since we are mainly checking the most recent points, we store what we have seen on a stack."}</p>
<Code>
    {convex}
</Code>
<p>We only check the cross product if we already have 2 points on the stack, hence only checking when attempting to add the third point.</p>
</p>

<p>Due to the sort, the time complexity becomes <Latex>{"n \\log n"}</Latex>. However, if sorts are already done, such as by x-coordinate or by angle relative to the bottom point, we can calculate the hull in linear time.</p>
</div>
    )
}