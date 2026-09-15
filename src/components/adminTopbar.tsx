import { useState } from 'react'

function Footer() {
  const [count, setCount] = useState(0)

  return (
    <>
        <div className="admin-topbar">
            <div className="admin-brand">
                <img src="./img/logotransparente.png" alt=""/>
                Orb<em>Isa</em>
            </div>
            <span className="admin-topbar-tag">Panel de administración</span>
            <nav className="admin-topbar-links">
                <a href="admin.html">Productos</a>
                <a href="pedidos.html">Pedidos</a>
                <a href="index.html">Ver sitio</a>
                <a href="#" id="adminLogout">Cerrar sesión</a>
            </nav>
            </div>
    </>
  )
}

export default Footer
