import React from 'react'
import ReactDOM from 'react-dom/client'
import Experience from './Experience.tsx'
import './index.css'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import About from './About.tsx'

const router = createBrowserRouter([
  {
      path:"/",
      element: <Experience/>,
      children: [
        {
          path: "about",
          element: <About/>
        },
        {
          path: "home",
          element: <div>home</div>
        },
        {
          path: "notes",
          element: <><div>notes</div>
          <div>notes</div></>
        }
      ]
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <RouterProvider router={router}/>
  </React.StrictMode>
)
