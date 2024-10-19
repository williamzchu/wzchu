import Code from "../../Code"
import camera from "./pinhole-camera.png"
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { MathJax, MathJaxContext } from "better-react-mathjax";

const sendrays = `
for (int j = 0; j < image_height; j++) {
    for (int i = 0; i < image_width; i++) {
        auto pixel_center = pixel00_loc + (i * pixel_delta_u) + (j * pixel_delta_v);
        auto ray_direction = pixel_center - camera_center;
        ray r(camera_center, ray_direction);
    }
}
`


export default function RaytracingBasics(){
    return (
<div>
<MathJaxContext>
<p>Perhaps before we start talking about tracing anything, we need to be able to see. We ultimately need that camera. 
This leads into one of the reasons why this concept of ray-tracing is so beautiful, because of it's start with the camera.
</p>
<p>
A simple camera could be thought of as similar triangles with parameters of your screen resolutions as well as a focal length. 
In fact, the easiest way to think of one is as a pinhole camera.
</p>

<h3>Pinhole Camera</h3>
<img src={camera}></img>  

<p>However, the most important thing to note is that there are similar triangles, if we look at the focal point to our object, and from our screen to the focal point. 
As a result, we can simply just cast rays from a focal point towards our models, with pixel plane in between to represent our screen, and that will have the same intrinsic parameters as our camera.
</p>

<p>This allows us to cast rays by representing each ray as a vector, which we define as the difference between the pixel on our screen and the camera origin.
</p>

<h3>Sending rays</h3>
<Code>{sendrays}</Code>

<p>Basic raytracing ultimately relies on this bit of code, or a variation of it. </p>
<p>Now another thing that has to be mentioned is that the above code only takes one ray per pixel. 
However, for the classical brute force ray-tracers, also known as Monte-Carlo ray-tracers, we shoot multiple rays for each pixel, with random variation.
</p>

<p> 
    We first need to take a look at what equation we are modeling with these rays. Although the rendering equation is actually quite complex with many parameters, 
    here is one <a href="https://en.wikipedia.org/wiki/Rendering_equation">variation</a> that represents the reflected light <MathJax style={{display:"inline"}}>{"\\(    L_r   \\)"}</MathJax> along the vector <MathJax style={{display:"inline"}}>{"\\(    \\omega_0   \\)"}</MathJax> which is towards the viewer.
</p>

<MathJax style={{display:"inline"}}>{"\\(    L_r(\\text{x},\\omega_0, \\lambda, t) = \\int_\\omega f_r (\\text{x}, \\omega_i, \\omega_0, \\lambda, t) L_i(\\text{x}, \\omega_i, \\lambda, t) (\\omega_i \\cdot \\text{n}) \\text{d} \\omega_i \\)"}</MathJax>

<p>We can see that this represents a continuous integral over <MathJax style={{display:"inline"}}>{"\\( \\omega  \\)"}</MathJax> which represents a hemisphere of the point we are observing.</p>

<p>Now obviously, we don't take a continuous integral in computers, adding an infinite number of small sections.
Instead we sample, resulting in why we show rays with random variation, allowing us to approximate this integral.
More samples would give better approximations as it is able to represent more rays in our integrals, yet comes with computational cost.    
</p> 

</MathJaxContext>
</div>)
}