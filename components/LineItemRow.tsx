"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { LineItem } from "@/types/invoice";
import { formatCurrency } from "@/lib/formatCurrency";
import type { Currency } from "@/types/invoice";

interface LineItemRowProps {
  item: LineItem;
  currency: Currency;
  onChange: (id: string, field: keyof LineItem, value: string | number) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

export default function LineItemRow({
  item,
  currency,
  onChange,
  onRemove,
  canRemove,
}: LineItemRowProps) {
  const total = item.quantity * item.unitPrice;

  return (
    <tr className="border-b border-border">
      <td className="p-2">
        <Input
          value={item.description}
          onChange={(e) => onChange(item.id, "description", e.target.value)}
          placeholder="Description"
          className="min-w-[180px]"
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          value={item.quantity || ""}
          onChange={(e) =>
            onChange(item.id, "quantity", parseInt(e.target.value) || 0)
          }
          min={1}
          className="w-20"
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          value={item.unitPrice || ""}
          onChange={(e) =>
            onChange(item.id, "unitPrice", parseFloat(e.target.value) || 0)
          }
          min={0}
          className="w-32"
        />
      </td>
      <td className="p-2 text-right font-medium whitespace-nowrap">
        {formatCurrency(total, currency)}
      </td>
      <td className="p-2">
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onRemove(item.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </td>
    </tr>
  );
}
