"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ClipboardCheck, MapPin, ShieldLock, PlusCircle, Lock } from "lucide-react";

export default function DashboardCards() {
  const router = useRouter();

  const [userRole, setUserRole] = useState<"admin" | "client" | "incharge">("client");
  const [attendancePoint, setAttendancePoint] = useState<string>("");
  const [searchPoint, setSearchPoint] = useState<string>("");
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [newPointName, setNewPointName] = useState<string>("");
  const [newPointAddress, setNewPointAddress] = useState<string>("");

  const handleCheckAttendance = () => {
    if (!attendancePoint.trim()) {
      toast.error("Invalid Input", { description: "Please enter a valid point name." });
      return;
    }
    toast.success("Fetching Attendance", { description: `Loading records for ${attendancePoint}...` });
  };

  const handleCheckPointData = () => {
    if (!searchPoint.trim()) {
      toast.error("Invalid Input", { description: "Please enter a valid point name." });
      return;
    }
    toast.info("Fetching Station Data", { description: `Retrieving profile for ${searchPoint}...` });
  };

  const handleRegisterPoint = () => {
    if (userRole !== "admin") {
      toast.error("Access Denied", { description: "Only administrators can register new points." });
      return;
    }
    if (!newPointName || !newPointAddress) {
      toast.error("Missing Fields", { description: "Please provide both point name and address." });
      return;
    }
    toast.success("Point Registered", { description: `Successfully added ${newPointName} to the network.` });
    setNewPointName("");
    setNewPointAddress("");
  };

  const handleAdminAuthVerify = () => {
    if (adminPassword === "AdminSecure123!") {
      setUserRole("admin");
      toast.success("Admin Verified", { description: "Full registry access unlocked." });
    } else {
      toast.error("Authentication Failed", { description: "Incorrect administrator password." });
    }
    setIsAdminModalOpen(false);
    setAdminPassword("");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Current Role: <span className="font-semibold uppercase text-primary">{userRole}</span>
          </p>
        </div>
        {userRole === "admin" && (
          <button
            onClick={() => setUserRole("client")}
            className="text-xs bg-slate-200 dark:bg-slate-800 px-3.5 py-1.5 rounded-full hover:bg-slate-300 transition-colors font-medium"
          >
            Lock Admin Mode
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center gap-2 text-blue-600">
              <ClipboardCheck className="w-6 h-6" />
              <CardTitle className="text-xl">Check Attendance</CardTitle>
            </div>
            <CardDescription>Verify guard attendance logs by business point name.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Enter Point / Business Name"
              value={attendancePoint}
              onChange={(e) => setAttendancePoint(e.target.value)}
              className="rounded-full"
            />
          </CardContent>
          <CardFooter>
            <Button onClick={handleCheckAttendance} className="w-full rounded-full">
              Check Attendance
            </Button>
          </CardFooter>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center gap-2 text-emerald-600">
              <MapPin className="w-6 h-6" />
              <CardTitle className="text-xl">Check Point Data</CardTitle>
            </div>
            <CardDescription>View location profiles and station metadata.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Enter Point Name"
              value={searchPoint}
              onChange={(e) => setSearchPoint(e.target.value)}
              className="rounded-full"
            />
          </CardContent>
          <CardFooter>
            <Button onClick={handleCheckPointData} variant="outline" className="w-full rounded-full">
              Fetch Point Details
            </Button>
          </CardFooter>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-600">
                <ShieldLock className="w-6 h-6" />
                <CardTitle className="text-xl">View All Points Data</CardTitle>
              </div>
              {userRole !== "admin" && <Lock className="w-5 h-5 text-slate-400" />}
            </div>
            <CardDescription>Master overview across all registered security points.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              {userRole === "admin"
                ? "Re-authentication required to access full point registry."
                : "Administrator privileges required to view full registry."}
            </p>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => setIsAdminModalOpen(true)}
              disabled={userRole !== "admin"}
              className="w-full rounded-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Access Full Registry
            </Button>
          </CardFooter>
        </Card>

        <Card className={`rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between ${userRole !== "admin" ? "opacity-60 pointer-events-none" : ""}`}>
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-600">
              <PlusCircle className="w-6 h-6" />
              <CardTitle className="text-xl">Register New Point</CardTitle>
            </div>
            <CardDescription>Add a new business or location to the security network.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Business / Point Name"
              value={newPointName}
              onChange={(e) => setNewPointName(e.target.value)}
              disabled={userRole !== "admin"}
              className="rounded-full"
            />
            <Input
              placeholder="Point Address / Location"
              value={newPointAddress}
              onChange={(e) => setNewPointAddress(e.target.value)}
              disabled={userRole !== "admin"}
              className="rounded-full"
            />
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleRegisterPoint}
              disabled={userRole !== "admin"}
              className="w-full rounded-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              Register Point
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={isAdminModalOpen} onOpenChange={setIsAdminModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Admin Security Re-authentication</DialogTitle>
            <DialogDescription>
              Please enter your administrator password to unlock full registry access.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              type="password"
              placeholder="Enter Admin Password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="rounded-full"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsAdminModalOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button onClick={handleAdminAuthVerify} className="rounded-full">
              Verify & Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}