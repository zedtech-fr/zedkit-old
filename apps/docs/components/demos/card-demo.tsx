import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@zedtech/zedkit-ui";
import { cardCopy } from "@/components/demos/i18n/card-copy";

/** A store order as a self-contained card: title, who and when, then the lines. */
export function CardDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{cardCopy.demo.title}</CardTitle>
        <CardDescription>{cardCopy.demo.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table aria-label={cardCopy.demo.tableAriaLabel}>
          <TableHeader>
            <TableRow>
              <TableHead>{cardCopy.demo.columns.item}</TableHead>
              <TableHead>{cardCopy.demo.columns.qty}</TableHead>
              <TableHead>{cardCopy.demo.columns.price}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cardCopy.demo.rows.map((row) => (
              <TableRow key={row.item}>
                <TableCell>{row.item}</TableCell>
                <TableCell>{row.qty}</TableCell>
                <TableCell>{row.price}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Text className="mt-4 font-medium">{cardCopy.demo.total}</Text>
      </CardContent>
    </Card>
  );
}
