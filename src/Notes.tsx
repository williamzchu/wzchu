import { Outlet, useOutlet } from "react-router-dom"
import {buttons, noteMap} from "./notes/notesPages"


export default function Notes({page}:{page:string}){
    console.log(page)
    if (page != "/notes"){
        const element = noteMap.get(page);
        console.log(noteMap)
        console.log(element)
        return <>{element}</>
    }

    else{
        return <div>
            {buttons}
        </div>
    }
}