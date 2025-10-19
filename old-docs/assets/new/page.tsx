'use client';

import { AssetForm } from '@/components/assets/asset-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function NewAssetPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Add New Asset</h1>
        <p className="text-muted-foreground">
          Create a new asset record for tracking and management.
        </p>
      </div>

      <AssetForm />
    </div>
  );
}