import { vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs";
import cpp from 'react-syntax-highlighter/dist/esm/languages/hljs/cpp';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';

SyntaxHighlighter.registerLanguage('cpp', cpp);

export default function Code({children} : {children: any}){
    return (
        <div>
            <SyntaxHighlighter customStyle={{borderColor: "darkslategray", borderStyle: "solid", borderRadius: "4px", width:"60vw"}} language="cpp" style={vs2015}>
                {children}
            </SyntaxHighlighter>
        </div>
    )
}