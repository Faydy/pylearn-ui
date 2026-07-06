export default function SidebarComponent({name = "Component", icon: Icon, hasBorder = true}){
    return(
        <div className={`flex items-center p-2 gap-3 rounded-t-xl pt-2 pb-2 w-full hover:bg-[#2c2c2c] transition-colors cursor-pointer ${hasBorder? 'border-b border-gray-700' : ''}`}>
            {Icon && <Icon className="w-5 h-5" />}
            <span>{name}</span>
        </div>
    );
}