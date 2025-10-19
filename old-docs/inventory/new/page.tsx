'use client';

import { InventoryForm } from '@/components/inventory/inventory-form';

export default function NewInventoryItemPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Add New Inventory Item</h1>
        <p className="text-muted-foreground">
          Create a new inventory item for stock management and tracking.
        </p>
      </div>

      <InventoryForm />
    </div>
  );
}
