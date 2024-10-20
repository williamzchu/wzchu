export default function About(){
    return <>
        <h1>Welcome! </h1>
        <p>This is not really a portfolio site, but just a place for me to keep notes.</p>
        <p>More specifically, I put this site together mainly by my interests in computer graphics and visual computing (no not because I'm a fan of frontend and design, although there are some fun cases) as a way to interactively put together some references for myself similar to a diary or blog, and I found this wonderful wrapper for webGL called threeJS. So I decided to see what is possible with it. </p>
        <p>Overall most things should be possible. As long as I can move triangles and vertices around to where I want it to be, anything is possible! We can do any animation and any model, as shown when you hover those big navigation buttons to the right...</p>
        <p>Of course I can simply just go on and on about the steps: just represent 3D vertices and operations that control those vertices. Then you will need to develop some framework that lets you access those operations, then do some interface or canvas which is another nightmare in itself, the entire rasterization process or raytracing if you are feeling fancy or some raymarching for less unique shapes, can't forget about some way to render text, ah wait what if I want some interactible buttons, maybe some mouse input here, now what about lighting and shaders too, hmm maybe it would be cool if I make a backend server for this, maybe I need CUDA or Optix, and the list goes on and on and on.</p>
        <p>In other words, for something light and basic, thank webapps and React.</p>
        <div style={{height:"2vh"}}></div>
        <p>Anyways, this "about" page should have at least a little about the person behind it. </p>
        <p>I go by Will. I just like seeing cool things, along with some additional touches in visual computing, machine learning, and math. My interests lie in the intersections between data, visuals, and statistics, afterall: what is cooler than computing something you can use or see!</p>
        <div style={{height:"2vh"}}></div>
        <p>Here is my 22 year old dog representing this page!</p>
        <img src="creamy2.png"></img>
        <div style={{height:"3vh"}}></div>
        <h1>Contacts</h1>
        <a href="https://github.com/williamzchu" style={{color: "gray"}}>Github</a>
        <p>Email: williamzchu@gmail.com</p>
        <p>If there is no reply after two days, please follow up! We all miss things in the stack, especially for me!</p>

    </>
}