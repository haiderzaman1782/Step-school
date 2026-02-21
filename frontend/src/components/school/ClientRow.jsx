import { Eye, ExternalLink, MapPin, Users, Trash2, Pencil } from 'lucide-react';

const formatPkr = (n) =>
    parseFloat(n || 0).toLocaleString('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 });

const ClientRow = ({ client, onSelect, onDelete, onEdit }) => {
    return (
        <tr className="group hover:bg-muted/10 transition-colors cursor-pointer" onClick={onSelect}>
            <td className="px-8 py-5">
                <div className="flex flex-col">
                    <span className="font-bold text-foreground text-sm leading-tight group-hover:text-primary transition-colors">{client.name}</span>
                    <span className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest mt-0.5">
                        Director: {client.director_name || 'Not Assigned'}
                    </span>
                </div>
            </td>
            <td className="px-8 py-5">
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm font-medium">
                    <MapPin className="w-3.5 h-3.5 opacity-50" />
                    {client.city}
                </div>
            </td>
            <td className="px-8 py-5 text-right">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/30 text-muted-foreground border border-border/10">
                    <Users className="w-3 h-3" />
                    <span className="text-xs font-black">{client.total_seats}</span>
                </div>
            </td>
            <td className="px-8 py-5 text-right">
                <span className="text-sm font-medium text-muted-foreground">{formatPkr(client.seat_cost)}</span>
            </td>
            <td className="px-8 py-5 text-right">
                <span className="text-sm font-black text-primary">{formatPkr(client.total_amount)}</span>
            </td>
            <td className="px-8 py-5 text-right pr-12">
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-2 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                        title="Edit Client"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onSelect(); }}
                        className="p-2 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                        title="Open Dashboard"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-2 rounded-xl text-destructive/40 hover:bg-destructive/10 hover:text-destructive transition-all"
                        title="Delete School"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default ClientRow;
