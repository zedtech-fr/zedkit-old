"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Heading,
  Input,
  Label,
  Stack,
  Text,
} from "../specimen-primitives.js";
import { specimenMessagesEn } from "./specimens-messages.js";

type Product = { id: string; name: string; price: number; stock: number };

const SEED: Product[] = [
  { id: "bowl", name: "Stoneware bowl", price: 48, stock: 6 },
  { id: "mug", name: "Glazed mug", price: 32, stock: 2 },
];

export type CommerceSpecimenProps = { className?: string; messages?: typeof specimenMessagesEn.commerce };

type CommerceMessages = typeof specimenMessagesEn.commerce;

function CommerceProductList({
  messages,
  products,
  selectedId,
  onSelect,
}: {
  messages: CommerceMessages;
  products: Product[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ul aria-label={messages.listAriaLabel} className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
      {products.map((item) => (
        <li key={item.id}>
          <Button
            type="button"
            variant="outline"
            aria-pressed={item.id === selectedId}
            className="h-auto! min-h-11 w-full flex-col items-start gap-1 p-3 text-left font-normal whitespace-normal"
            onClick={() => onSelect(item.id)}
          >
            <Text as="span" className="font-medium">
              {item.name}
            </Text>
            <Badge variant={item.stock <= 2 ? "warning" : "secondary"}>
              {item.stock <= 2 ? messages.lowStock(item.stock) : messages.inStock(item.stock)}
            </Badge>
          </Button>
        </li>
      ))}
    </ul>
  );
}

function CommerceInventoryEditor({
  messages,
  product,
  priceId,
  stockId,
  onPriceChange,
  onStockChange,
  onSave,
  status,
}: {
  messages: CommerceMessages;
  product: Product;
  priceId: string;
  stockId: string;
  onPriceChange: (value: number) => void;
  onStockChange: (value: number) => void;
  onSave: () => void;
  status: string;
}) {
  return (
    <Card className="min-w-0">
      <CardContent className="pt-4">
        <Stack gap={3} className="min-w-0 sm:flex-row sm:flex-wrap sm:items-end">
          <Stack gap={1} className="min-w-0 flex-1 basis-28">
            <Label htmlFor={priceId}>{messages.priceLabel}</Label>
            <Input
              id={priceId}
              inputMode="numeric"
              value={product.price}
              onChange={(event) => onPriceChange(Math.max(0, Number.parseInt(event.target.value, 10) || 0))}
            />
          </Stack>
          <Stack gap={1} className="min-w-0 flex-1 basis-28">
            <Label htmlFor={stockId}>{messages.stockLabel}</Label>
            <Input
              id={stockId}
              inputMode="numeric"
              value={product.stock}
              onChange={(event) => onStockChange(Math.max(0, Number.parseInt(event.target.value, 10) || 0))}
            />
          </Stack>
          <Button type="button" className="w-fit" onClick={onSave}>
            {messages.save}
          </Button>
        </Stack>
        <Text variant="muted" role="status" className="mt-3 min-h-6">
          {status}
        </Text>
      </CardContent>
    </Card>
  );
}

export function CommerceSpecimen({ className, messages = specimenMessagesEn.commerce }: CommerceSpecimenProps) {
  const [products, setProducts] = useState<Product[]>(SEED);
  const [selectedId, setSelectedId] = useState(SEED[0]!.id);
  const [status, setStatus] = useState("");
  const product = products.find((item) => item.id === selectedId) ?? products[0]!;
  const priceId = "zk-specimen-commerce-price";
  const stockId = "zk-specimen-commerce-stock";

  return (
    <Stack gap={4} className={`min-w-0 ${className ?? ""}`} data-slot="commerce-specimen" data-specimen-domain="commerce">
      <Stack gap={1}>
        <Heading level={3}>{messages.heading}</Heading>
        <Text variant="muted">{messages.description}</Text>
      </Stack>
      <CommerceProductList
        messages={messages}
        products={products}
        selectedId={product.id}
        onSelect={(id) => {
          setSelectedId(id);
          setStatus("");
        }}
      />
      <CommerceInventoryEditor
        messages={messages}
        product={product}
        priceId={priceId}
        stockId={stockId}
        onPriceChange={(value) =>
          setProducts((list) => list.map((row) => (row.id === product.id ? { ...row, price: value } : row)))
        }
        onStockChange={(value) =>
          setProducts((list) => list.map((row) => (row.id === product.id ? { ...row, stock: value } : row)))
        }
        onSave={() => setStatus(messages.saved(product.name))}
        status={status}
      />
    </Stack>
  );
}
