/* =========================================
   PART 1: THE RPG LOGIC (The Brain)
   ========================================= */

let gameState = {
    gold: 50,
    flags: { hasMetShopkeeper: false, shopkeeperAnnoyed: false }
};

// Helper to update the UI we added in HTML
function updateText(text) {
    document.getElementById("message-text").innerHTML = text;
}

// Called when player clicks an "Item" entity
function examine(item) {
    if (item === 'sword') {
        updateText("A rusty iron sword. 50 Gold.");
    } 
    else if (item === 'potion') {
        updateText("A weird red potion. It smells like strawberries.");
    }
    else {
        updateText("Just a generic item.");
    }
}

// Called when player clicks a "Character" entity
function interact(target) {
    if (target === 'shopkeeper') {
        const choices = document.getElementById("choices-area");
        choices.classList.remove("hidden"); // Show buttons

        if (gameState.flags.shopkeeperAnnoyed) {
            updateText("Shopkeeper: 'Hurry up!'");
        } else {
            updateText("Shopkeeper: 'Welcome to my shop!'");
            gameState.flags.hasMetShopkeeper = true;
        }
    }
}

// Called by the HTML buttons
function makeChoice(action) {
    const choices = document.getElementById("choices-area");
    
    if (action === 'buy') {
        updateText("Shopkeeper: 'Excellent choice.' (-50 Gold)");
        gameState.gold -= 50;
        choices.classList.add("hidden");
    } 
    else if (action === 'leave') {
        updateText("Shopkeeper: 'Begone then.'");
        gameState.flags.shopkeeperAnnoyed = true;
        choices.classList.add("hidden");
    }
}

/* =========================================
   PART 2: THE ENGINE (The Visuals)
   ========================================= */

(function(){
    const gv = window.gameViewport;
    const stage = gv.stage;
    const entities = [];

    // CSS for the entities
    function injectStyles(){
        const s = document.createElement('style');
        s.textContent = `
        .entity { 
            position: absolute; 
            background: #6aa; 
            border: 2px solid #fff; 
            display: flex; align-items: center; justify-content: center; 
            color: white; font-family: sans-serif; cursor: pointer;
            box-shadow: 4px 4px 0px #222; /* Retro shadow */
        }
        .entity:hover { background: #8cc; top: -2px; } /* Hop effect */
        `;
        document.head.appendChild(s);
    }

    // MODIFIED: Added onclick handler logic here
    function spawnEntity(x, y, opts={}) {
        const el = document.createElement('div');
        el.className = 'entity';
        el.style.width = (opts.w || 64) + 'px';
        el.style.height = (opts.h || 64) + 'px';
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.textContent = opts.label || '';
        
        // THE BRIDGE: Connect click to RPG Logic
        el.onclick = function() {
            if (opts.actionType === 'examine') {
                examine(opts.actionTarget);
            } else if (opts.actionType === 'interact') {
                interact(opts.actionTarget);
            }
        };

        stage.appendChild(el);
        entities.push({ el, ...opts });
    }

    function init(){
        injectStyles();

        // 1. Spawn the Shopkeeper (Character)
        spawnEntity(600, 200, { 
            w: 100, h: 200, 
            label: "Shopkeep", 
            actionType: 'interact', 
            actionTarget: 'shopkeeper' 
        });

        // 2. Spawn a Sword (Item)
        spawnEntity(300, 300, { 
            w: 64, h: 64, 
            label: "Sword", 
            actionType: 'examine', 
            actionTarget: 'sword' 
        });

        // 3. Spawn a Potion (Item)
        spawnEntity(900, 350, { 
            w: 40, h: 40, 
            label: "Potion", 
            actionType: 'examine', 
            actionTarget: 'potion' 
        });
    }

    if(document.readyState === 'complete') init();
    else window.addEventListener('DOMContentLoaded', init);
})();