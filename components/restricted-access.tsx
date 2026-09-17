import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RestrictedAccess() {
  return (
    <div className="container mx-auto flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md rounded-3xl">
        <CardHeader className="items-center text-center">
          <Image
            src="/Alamanlogo.png"
            alt="Alaman logo"
            width={48}
            height={48}
            priority
            className="mx-auto mb-2 rounded-full"
          />
          <CardTitle className="text-2xl">Restricted Access</CardTitle>
          <CardDescription>
            Only the incharge can view this page. Sign in with the incharge
            account to manage the registry and guard attendance.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Link href="/login" className="flex w-full">
            <Button className="w-full rounded-full">Login</Button>
          </Link>
          <p className="text-center text-xs text-muted-foreground">
            Alaman Security · Point Registry
          </p>
        </CardContent>
      </Card>
    </div>
  );
}