import { MathJax, MathJaxContext } from "better-react-mathjax";
import Latex from "../../Latex";
import Code from "../../Code";

export default function intersections(){

const intersection1 = `double intersection(const point3& center, double radius, const ray& r) {
    vec3 qc = r.origin() - center;
    auto a = dot(r.direction(), r.direction());
    auto b = 2.0 * dot(r.direction(), qc);
    auto c = dot(qc, qc) - radius*radius;
    auto discriminant = b*b - 4*a*c;
    return discriminant;
}
`
const intersection2 = `double intersection(const point3& center, double radius, const ray& r) {
    vec3 qc = r.origin() - center;
    auto a = dot(r.direction(), r.direction());
    auto b = dot(r.direction(), qc);
    auto c = dot(qc, qc) - radius*radius;
    auto discriminant = b*b - *a*c;
    return discriminant;
}

vec3 normal(const point3& center, double radius, const ray& r) {    
    vec3 qc = r.origin() - center;
    auto a = dot(r.direction(), r.direction());
    auto h = dot(r.direction(), qc);
    auto c = dot(qc, qc) - radius*radius;
    auto discriminant = b*b - *a*c;

    auto sqrtd = std::sqrt(discriminant);
    auto root = (-h - sqrtd)/a;

    auto normal = (r.at(root) - center) / radius;
    return normal;
}
`

const intersection3 = `double intersection(const point3& center, double radius, const ray& r) {
    vec3 cq = center - r.origin();
    auto a = dot(r.direction(), r.direction());
    auto b = dot(r.direction(), qc);
    auto c = dot(cq, cq) - radius*radius;
    auto discriminant = b*b - *a*c;
    return discriminant;
}

vec3 normal(const point3& center, double radius, const ray& r) {    
    vec3 cq = center - r.origin();
    auto a = dot(r.direction(), r.direction());
    auto b = dot(r.direction(), qc);
    auto c = dot(cq, cq) - radius*radius;
    auto discriminant = b*b - *a*c;
    return discriminant;

    auto sqrtd = std::sqrt(discriminant);
    auto root = (h - sqrtd)/a;

    auto normal = (r.at(root) - center) / radius;
    return normal;
}
`

    return (
<div>
<MathJaxContext>
<p>An essential part of every ray tracer is to calculate the intersection, essentially checking what our ray hits.
However, depending on the shape of our object, this can be quite not intuitive, especially to compute efficiently.
</p>



<p>
Recall we represent a ray as a function of time, where <MathJax style={{display:"inline"}}>{"\\(    R(t) = Q + t \\vec{d}  \\)"}</MathJax>.
</p>

<p>
We also need a surface that we would hit. Although some of the most common surfaces could be triangles, we start off with one that is easy to define, that being a sphere.
</p>

<p>A sphere is actually quite easy to define, with simply a 3D center <Latex>{"C"}</Latex> and a radius <Latex>r</Latex>.</p>

<p>Commonly, we see spheres defined as <Latex>(x - C_x)^2 + (y - C_y )^2 + (z - C_z)^2 = r^2</Latex>, where point <Latex>P = (x,y,z)</Latex> satisfies this equation, and thus <Latex>P </Latex> satisfies if it is any point on the sphere.
To make notation easier, we can actually represent this as a dot product, as <Latex>(P-C) \cdot (P-C) = r^2</Latex>.

</p>

<p>
Now if we simply let <Latex>P = R(t)</Latex>, our ray, we obtain <Latex>(R(t)-C) \cdot (R(t)-C) = r^2</Latex>, and by further expanding our ray:

</p>
<p style={{textAlign: "center", paddingRight: "33%"}}><Latex>{"(t \\vec{d} + Q-C) \\cdot (t \\vec{d} + Q -C) = r^2"}</Latex></p>

<p>By doing some vector algebra to distribute the left term:</p>
<p style={{textAlign: "center", paddingRight: "33%"}}><Latex>{"[(t \\vec{d}) \\cdot (t \\vec{d} + Q -C)] + [(Q - C) \\cdot (t \\vec{d} + Q -C)] = r^2"}</Latex></p>
<p style={{textAlign: "center", paddingRight: "33%"}}><Latex>{"[(t \\vec{d}) \\cdot (t \\vec{d}) + (t \\vec{d}) \\cdot (Q -C)] + [(Q - C) \\cdot (t \\vec{d}) + (Q -C) \\cdot (Q-C)] = r^2"}</Latex></p>
<p style={{textAlign: "center", paddingRight: "33%"}}><Latex>{"t^2 \\vec{d} \\cdot \\vec{d} + 2t \\vec{d} \\cdot (Q - C) + (Q-C) \\cdot (Q-C) -r^2 = 0"}</Latex></p>

<p> Since dot products are scalar/constant values, we have a quadratic equation as a function of <Latex>t</Latex>!
We can use the quadratic equation and let:
</p>
<p style={{textAlign: "center", paddingRight: "33%"}}><Latex>{"a = \\vec{d} \\cdot \\vec{d}"}</Latex></p>
<p style={{textAlign: "center", paddingRight: "33%"}}><Latex>{"b = 2 \\vec{d} \\cdot (Q-C)"}</Latex></p>
<p style={{textAlign: "center", paddingRight: "33%"}}><Latex>{"c = (Q-C) \\cdot (Q-C) - r^2"}</Latex></p>

<p>Currently, we aren't actually interested in the actual value of <Latex>t</Latex>. 
Instead, we just want to know if <Latex>t</Latex> can even exist, and thus there is an intersection between the ray and the sphere.
Therefore, we only need to check the discriminant <Latex>{"\\sqrt{ b^2 - 4ac }"}</Latex> and see how many solutions there are.
From basic alebgra, no solutions means the ray doesn't intersect. One solution, when <Latex>b^2 - 4ac = 0</Latex>, means we only intersect the sphere once, right along it's boundary. 
Two solutions, when the discriminant is positive, means that the ray goes through the sphere and out the other side, hitting it twice.
</p>

<p>Therefore when given a sphere's center and radius, along with our ray, we can tell if there is an intersection simply by checking the discriminant:
</p>
<Code>
{intersection1}
</Code>

<p>
However, we actually do need to <Latex>t</Latex> value, as in order to calculate the surface normal of a sphere, it is simply <Latex>P - C</Latex>, or the difference between the intersection point and the sphere's center, where <Latex>P</Latex> is where our ray is at <Latex>{"P = Q + t \\vec{d}"}</Latex>.

</p>
<p style={{textAlign: "center", paddingRight: "33%"}}><Latex>{"t = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"}</Latex></p>

We then note that when we expand this quadratic equation, there are some simplifications we can reduce by expanding <Latex>b</Latex>.
<p style={{textAlign: "center", paddingRight: "33%"}}><Latex>{"t = \\frac{-2\\vec{d} (Q-C) \\pm \\sqrt{(-2\\vec{d} (Q-C))^2-4ac}}{2a}"}</Latex></p>
<p style={{textAlign: "center", paddingRight: "33%"}}><Latex>{"= \\frac{-2\\vec{d} (Q-C) \\pm \\sqrt{4(\\vec{d} (Q-C))^2-4ac}}{2a}"}</Latex></p>
<p style={{textAlign: "center", paddingRight: "33%"}}><Latex>{"= \\frac{-2\\vec{d} (Q-C) \\pm 2 \\sqrt{(\\vec{d} (Q-C))^2-ac}}{2a}"}</Latex></p>
<p style={{textAlign: "center", paddingRight: "33%"}}><Latex>{"= \\frac{-\\vec{d} (Q-C) \\pm \\sqrt{(\\vec{d} (Q-C))^2-ac}}{a}"}</Latex></p>

<p>Therefore, we can simply just replace <Latex>b</Latex> by dividing it by 2, which I now use <Latex>h</Latex> to denote the variable, resulting in less calculations overall.</p>

<Code>
    {intersection2}
</Code>

<p>One more thing to note is that since <Latex>t</Latex> is just a positive scalar representing how far forward the ray went, instead of doing both additiona and subtraction, we only subtract as that is obviously closer.
However, there are cases where this could be important when deciding bounds for <Latex>t</Latex>, and addition might be the correct answer.
</p>

<p>
We can reduce the operations by just a bit more by switching around the order of our subtraction for the center and the intersection point. 
Instead of <Latex>(C - P)</Latex>, we can do <Latex>(P-C)</Latex>, which reverses the signs, and thus in the final part of the quadratic equation, we don't need a negative on the <Latex>b</Latex> term.
</p>
<Code>
    {intersection3}
</Code>

</MathJaxContext>
</div>
    )
}