export default function Raytracing(){

    return <div>
<p>
Now what is ray-tracing? Honestly, we all probably know it, as a buzzword in games and graphics. 
However, what is it really behind the idea of simply just "tracing rays?"

</p><p>    
Originally from Whitted in 1979, ray-tracing is literally just sending rays from the camera onto a three dimensional scene, then coloring the pixels based on what those rays touch.
Yet the nuances and reasoning behind the code can be quite hard, indulging in mixes between statistics and linear algebra, all the way to college level physics as well as keeping in mind computer science principles.
As a result, I have compiled my experiences with raytracing into these notes to boil down all the essentials to raytracing, mainly as a guide and "notes" for myself down the line, but perhaps it could be helpful for others getting started with graphics.</p>

<p>
These notes are mainly adapted from Peter Shirley's raytracing <a href="https://raytracing.github.io/books/RayTracingInOneWeekend.html">guide</a> and concepts from the staple book <a href="https://www.pbr-book.org">Physics Based Rendering: From Theory to Implementation</a>.
As a result, this is not going to be a complete repository of code to copy into a boiler plate for fully functional ray tracer, but as a helpful guide to clarify specific concepts and details that are discussed. 
If a step-by-step walkthough and code is needed, I would once again recommend reading Peter Shirley's text to dive straight in.
</p> 
    </div>
}