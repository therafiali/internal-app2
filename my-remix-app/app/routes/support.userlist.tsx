import { AppLayout } from "~/components/layout";
import DynamicHeading from "~/components/shared/DynamicHeading";

function SupportUserList() {
  return (
    <AppLayout>
        <div className="flex flex-col gap-4">
            <DynamicHeading title="User List" />
            
        </div>
    </AppLayout>
  )
}

export default SupportUserList;