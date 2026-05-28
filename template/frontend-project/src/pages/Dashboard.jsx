import { useState } from "react";
import { useAuth } from "../context/AuthContext";
    
const Dashboard = () => {
    const { user } = useAuth();


    return (
        <div className="dashboard">
            <article className="dash-greeting">
                <h1>Hey, {user?.username}</h1>
                <p>{user?.useremail}</p>
            </article>
        </div>
    );
};

export default Dashboard;
