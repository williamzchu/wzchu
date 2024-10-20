import { MathJax, MathJaxContext } from "better-react-mathjax";

export default function Latex({children} : {children: any}){
    return (
        <MathJaxContext>
            <MathJax style={{display:"inline"}}>{"\\( " + children + "  \\)"}</MathJax>
        </MathJaxContext>
    )
}
