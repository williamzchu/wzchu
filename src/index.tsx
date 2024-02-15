import React from 'react'
import ReactDOM from 'react-dom/client'
import Experience from './Experience.tsx'
import './index.css'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'

const router = createBrowserRouter([
  {
      path:"/",
      element: <Experience/>,
      children: [{
          path: "about",
          element: <div>hello</div>
        }
      ]
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <RouterProvider router={router}/>
  </React.StrictMode>
)
