import React from 'react'
import ReactDOM from 'react-dom/client'
import Experience from './Experience.tsx'
import './index.css'
import { Outlet, RouterProvider, createBrowserRouter, useOutlet } from 'react-router-dom'
import notesPages from './notes/notesPages.tsx'

const router = createBrowserRouter([
  {
      path:"/",
      element: <Experience/>,
      children: [
        {
          path: "about",
          element: <></>,
        },
        {
          path: "notes",
          element: <></>,
          children: notesPages
        }
      ]
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <RouterProvider router={router}/>
  </React.StrictMode>
)
