import { create } from "zustand";

interface PlayerStore {
    ids: string[];
    activeId?: string;
    setId: (id:string) => void;
    setIds: (ids: string[]) => void;
    reset: ()=>void;
};

const usePlayer = create<PlayerStore>((set) => ({
    ids: [],
    aciveId: undefined,
    setId: (id: string) => set({activeId: id}), // чтобы не перезависывать весь плейлист при смене трека
    setIds: (ids: string[]) => set({ids:ids}), // чтобы не сбрасывать трек при обновлении плейлиста
    reset: () => set({ids: [], activeId: undefined})
}));

export default usePlayer;