import { Canvas } from "@react-three/fiber"
import Latex from "../../Latex"
import DelaunayVisual from "./delaunayvisual"

export default function Delaunay(){
return (
<div>
<p>
After obtaining a convex hull, there is actually a lot we can do with it. One useful application is the Delaunay triangulation, which also corresponds to the Voronoi diagram. 
Essentially, the Delaunay triangualtion is the triangulation of some points where it maximizes the size of the smallest angle in any of the triangles. 
This can be obtained by properly subdividing the convex hull. 
We can also obtain the Voronoi diagram from the Delaunay triangulation, by connecting the centers of the circumcicles in each triangle in the Delaunay triangulation. 
As a result, the Delaunay triangulation corresponds to the dual graph of the voronoi diagram.
</p>

<p>
The Delaunay is important as it maximizes the minimum angles, resulting in "fat" triangles, rather than long and skinny.
This becomes extremely important in the world of graphics, where we constantly utilize triangles. 
Having long and skinny triangles will be prone to artifacts, and as a result, usually the graphics world likes these "nice" fat polygons.
Some example would be triangulating a set of points to create a nice mesh to render, or finding nice ways to map terrain in 3D, or even interpolating data.
</p>

<p>
However, this well studied data structure has a lot to of unintutive concepts behind it. We return to it's definition, it maximizes the minimum angle. 
There is an even better way to describe this, the circumcircle of any triangle/face in this triangulation has no other points. 
</p>
<div style={{borderStyle: "solid", borderColor: "white", borderWidth: "5px", height: "100px", width: "400px", margin: "auto"}}>
    <canvas id={"circumcircle"}></canvas>
</div>
<p>
Now from basic searches online, most sources just accept this fact and move on. But just what is the relationship between maximizing minimum angles and a circumcircle containing only the three points of the triangle?
</p>

<p>
There are actually many algorithms to calculate this triangulation. Many of which achieve <Latex>{"n \\log n"}</Latex> time, such as divide and conquer algorithms with linear merging time. 
However, some of these are uninspiring, as well as not able to be generalized to 3D or higher. 
Perhaps one of the easiest algorithms to understand as well as is generalizable to higher dimensions is the Boywer-Watson algorithm.
</p>

<div style={{borderStyle: "solid", borderColor: "white", borderWidth: "5px", height: "50vh"}}>
    <Canvas >
        <DelaunayVisual ref={null}/>
    </Canvas>
</div>

</div>
    )
}