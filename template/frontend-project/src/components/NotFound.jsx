import React from 'react'
import { Link } from 'react-router-dom'

function NotFound() {
    return (
        <div className='center'>
            <article>
                <h1>404</h1>
                <p>Page not found</p>
                <small>Go to <Link to='/dashboard'>Dashboard</Link></small>
            </article>
        </div>
    )
}

export default NotFound
