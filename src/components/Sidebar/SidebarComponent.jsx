import { Link, useLocation } from "react-router-dom";
export default function SidebarComponent({name = "Component", icon: Icon, selected = false, to = "/"}){
    const location = useLocation();
    const isActive = location.pathname === to;
    return(
        <Link to={to} className={`flex items-center p-2 gap-3 rounded-md pt-2 pb-2 w-full transition-colors text-s cursor-pointer ${isActive? "bg-accent-dim text-accent font-bold": "hover:bg-sidebar-hover text-muted"}`}>
            {Icon && <Icon className="w-5 h-5" />}
            <span>{name}</span>
        </Link>
    );
}