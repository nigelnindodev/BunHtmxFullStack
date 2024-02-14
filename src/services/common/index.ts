import { OrderEntity, OrderItemEntity } from "../../postgres/entities";

/**
 * Ensure when calling this funtion, the query for fetching order item entities should
 * also join with the inventory table, else will lead to undefined errors.
 *
 * TODO: Maybe come up with a way to type with requirement?
 */
export const getTotalOrderCost = (orderItems: OrderItemEntity[]): number => {
	if (orderItems.length === 0) {
		return 0;
	} else {
		let totalCost = 0;
		orderItems.forEach(item => {
			totalCost += item.quantity * item.inventory.price;
		});
		return totalCost;
		// above an be simplified with reduce
	}
}

/**
 * Gets a list of order entities and filters out the list to return orders with oly active
 * items.
 *
 * Currently only used for order items not in a completed status, but there may be a use case
 * in the future for other statuses as well, tis hsould support that as well without any changes.
 * 
 * TODO: Not very well optimized in the forEach loop. We might be able to early stop as soon as
 * an active order item is found.
 */
export const filterForOrdersWithActiveOrders = (orders: OrderEntity[]): OrderEntity[] => {
	return orders.filter(item => {
		let activeOrderFound = false;
		item.orderItems.forEach(orderItem => {
			if (orderItem.active === true) {
				activeOrderFound = true;
			}
		});
		return activeOrderFound;
	})
};

export const filterOrderItemsForActiveItems = (orderItems: OrderItemEntity[]): OrderItemEntity[] => {
	return orderItems.filter(item => item.active === true);
}
