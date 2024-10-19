import Code from "../../Code"
import camera from "./pinhole-camera.png"

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
This is known as sampling, and allows us to approximate the continuous integral in the light transport equation or the rendering equation!

</p>

</div>)
}