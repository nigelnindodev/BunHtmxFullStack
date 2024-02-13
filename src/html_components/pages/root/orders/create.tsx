import { InventoryEntity } from "../../../../postgres/entities";
import { InventoryItemSelectDuringOrder } from "./inventory_item_select_during_order";

export const CreateOrderSection = (orderId: number, inventoryData: InventoryEntity[]) => {
    return (
        <div>
            <h6>Create Order</h6>
            <div class="grid">
                <div>
                    <button role="button" class="outline" hx-get="/orders/list" hx-target="#orders-section">Back</button>
                </div>
                <div />
                <div />
                <div />
            </div>
            <div>
                    {InventoryItemSelectDuringOrder(orderId, inventoryData)}
                    <div id="active-items" hx-get={`/orders/active/${orderId}`} hx-trigger="every 1s"/>
            </div>
        </div>
    );
};
