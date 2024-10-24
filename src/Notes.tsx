import { Link } from "react-router-dom";
import {noteMap} from "./notes/notesPages"

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export default function Notes({page, handler}:{page:string, handler:any}){
    if (page != "/notes" && page){
        const p = noteMap.get(page);
        //console.log(p)
        
        if (p){
                return (<div style={{padding: "10%"}}>
                <h1>{ capitalizeFirstLetter(p.category)}</h1>
                <h2>
                    {!p.head? p.title? p.title :  capitalizeFirstLetter(p.path.substring(("/notes" + p.category).length + 2)): null}
                </h2>
                <div>
                    {p.element}
                </div>
                <div style={{display: "flex", flexWrap: "wrap", marginTop: "10%"}}>
                    {p.prev != null?         
                    <><p>Previous:</p>
                    <Link className="nav" to={p.prev} onClick={() => handler(p.prev)} style={{padding: "5px", fontSize: "large"}}>
                        {p.prev.substring("/notes/".length)}
                    </Link></>: 
                    null}
                </div>
                <div style={{display: "flex", flexWrap: "wrap"}}>
                    {p.next != null?         
                    <><p>Next:</p>
                    <Link className="nav" to={p.next} onClick={() => handler(p.next)} style={{padding: "5px", fontSize: "large"}}>
                        {p.next.substring("/notes/".length)}
                    </Link></>: 
                    null}
                </div>
            </div> )
        }
        else{
            return (
                <div>Page missing or under construction. Please go back to home.</div>
            )
        }
    }
}