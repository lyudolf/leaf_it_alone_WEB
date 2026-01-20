'use client';

import { useGameStore } from './store';
import { LeafBag } from './LeafBag';

export function BagManager() {
    const bags = useGameStore(s => s.bags);

    return (
        <>
            {bags.map(bag => (
                <LeafBag key={bag.id} id={bag.id} initialPos={bag.position} />
            ))}
        </>
    );
}
