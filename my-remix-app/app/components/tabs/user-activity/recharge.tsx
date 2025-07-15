import React, { useState } from "react";
import UserActivityLayout from "./layout";
import { DynamicTable } from "~/components/shared/DynamicTable";
import { useNavigate } from "@remix-run/react";
import type { ColumnDef } from "@tanstack/react-table";
import PrivateRoute from "~/components/private-route";
import DynamicHeading from "~/components/shared/DynamicHeading";
import DynamicButtonGroup from "~/components/shared/DynamicButtonGroup";

const tabOptions = [
    { label: "Recharge", value: "recharge" },
    { label: "Redeem", value: "redeem" },
];

const entOptions = [
    { label: "ALL ENT", value: "ALL" },
    { label: "ENT-1", value: "ENT-1" },
    { label: "ENT-2", value: "ENT-2" },
    { label: "ENT-3", value: "ENT-3" }
];

type Row = {
    team: string;
    initBy: string;
    depositor: string;
    rechargeId: string;
    platform: string;
    amount: string;
    type: string;
    target: string;
    targetId: string;
    timeElapsed: string;
    depositStatus: string;
    loadStatus: string;
};

const tableData: Row[] = [
    {
        team: "ENT-1",
        initBy: "Agent",
        depositor: "NadineMonique Gee\nBM-10006",
        rechargeId: "L-B87QE",
        platform: "umNadineMoniqueG\nULTRA PANDA",
        amount: "$20",
        type: "-",
        target: "-",
        targetId: "-",
        timeElapsed: "4d, 1h, 58m",
        depositStatus: "Pending",
        loadStatus: "Pending"
    },
    {
        team: "ENT-3",
        initBy: "Agent",
        depositor: "Sameer Khalid Khan\nPH-10137",
        rechargeId: "L-Y5CEJ",
        platform: "fk_sameer\nFIRE KIIRIN",
        amount: "$20",
        type: "PT",
        target: "$",
        targetId: "Rafi Ali",
        timeElapsed: "10d, 17h, 2m",
        depositStatus: "Verified",
        loadStatus: "Under Verification"
    },
    {
        team: "ENT-3",
        initBy: "Agent",
        depositor: "Sameer Khalid Khan\nPH-10137",
        rechargeId: "L-D5SSU",
        platform: "gv_sameer\nGAME VAULT",
        amount: "$50",
        type: "-",
        target: "-",
        targetId: "-",
        timeElapsed: "10d, 17h, 25m",
        depositStatus: "Pending",
        loadStatus: "Pending"
    },
    {
        team: "ENT-3",
        initBy: "Agent",
        depositor: "Sameer Khalid Khan\nPH-10137",
        rechargeId: "L-ZJM5M",
        platform: "fk_sameer\nFIRE KIIRIN",
        amount: "$50",
        type: "-",
        target: "-",
        targetId: "-",
        timeElapsed: "10d, 17h, 26m",
        depositStatus: "Pending",
        loadStatus: "Pending"
    }
];

const columns: ColumnDef<Row>[] = [
    { header: "TEAM", accessorKey: "team" },
    { header: "INIT BY", accessorKey: "initBy" },
    { header: "DEPOSITOR", accessorKey: "depositor" },
    { header: "RECHARGE ID", accessorKey: "rechargeId" },
    { header: "PLATFORM", accessorKey: "platform" },
    { header: "AMOUNT", accessorKey: "amount" },
    { header: "TYPE", accessorKey: "type" },
    { header: "TARGET", accessorKey: "target" },
    { header: "TARGET ID", accessorKey: "targetId" },
    { header: "TIME ELAPSED", accessorKey: "timeElapsed" },
    { header: "DEPOSIT STATUS", accessorKey: "depositStatus" },
    { header: "LOAD STATUS", accessorKey: "loadStatus" },
];

const RechargeTab: React.FC<{ activeTab: string }> = ({ activeTab = "recharge" }) => {
    const navigate = useNavigate();
    const [selectedEnt, setSelectedEnt] = useState("ALL");
    const [pageIndex, setPageIndex] = useState(0);
    const limit = 3;

    const filteredData = selectedEnt === "ALL"
        ? tableData
        : tableData.filter(row => row.team === selectedEnt);

    const pageCount = Math.ceil(filteredData.length / limit);
    const paginatedData = filteredData.slice(pageIndex * limit, (pageIndex + 1) * limit);

    return (
        <PrivateRoute section="support">
            <UserActivityLayout
                activeTab={activeTab}
                onTabChange={tab => navigate(`/support/useractivity/${tab}`)}
                tabOptions={tabOptions}
            >
                <div className="mb-4">
                    <DynamicButtonGroup
                        options={entOptions}
                        active={selectedEnt}
                        onChange={ent => {
                            setSelectedEnt(ent);
                            setPageIndex(0); // Reset to first page on ENT change
                        }}
                        className="mb-2"
                    />
                    <div className="border-b border-[hsl(var(--sidebar-border))] w-full" />
                </div>
                <DynamicTable
                    columns={columns}
                    data={paginatedData}
                    pagination={true}
                    pageIndex={pageIndex}
                    pageCount={pageCount}
                    limit={limit}
                    onPageChange={setPageIndex}
                />
            </UserActivityLayout>
        </PrivateRoute>
    );
};

export default RechargeTab;
