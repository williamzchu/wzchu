export default function CodeFunc({children} : {children: any}){
    return (
        <text style={{backgroundColor: 'darkslategray', borderStyle: "solid", borderRadius: "4px"}}>
            {children}
        </text>
    )
}