# Shared Components

This directory contains reusable components that can be used across the application.

## UserStatusWarningDialog

A dynamic warning dialog component that shows a confirmation dialog before changing user status. Supports any status type with customizable configurations.

### Usage

````tsx
import { UserStatusWarningDialog } from "~/components/shared/UserStatusWarningDialog";

function MyComponent() {
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStatusChange = (user) => {
    setSelectedUser(user);
    setWarningDialogOpen(true);
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      // Your status change logic here
      await updateUserStatus(selectedUser.id, newStatus);
      setWarningDialogOpen(false);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <button onClick={() => handleStatusChange(user)}>Ban User</button>

             <UserStatusWarningDialog
         open={warningDialogOpen}
         onOpenChange={setWarningDialogOpen}
         onConfirm={handleConfirm}
         userName={selectedUser?.name || ""}
         currentStatus={selectedUser?.status || ""}
         newStatus="banned"
         isLoading={isProcessing}
       />
     </>
   );
 }

### Usage Examples

#### Basic Usage (Automatic Detection)
```tsx
// Ban user - automatically uses red theme and ban-specific messaging
<UserStatusWarningDialog
  open={warningDialogOpen}
  onOpenChange={setWarningDialogOpen}
  onConfirm={handleConfirm}
  userName="John Doe"
  currentStatus="active"
  newStatus="banned"
  isLoading={isProcessing}
/>

// Activate user - automatically uses green theme and activation messaging
<UserStatusWarningDialog
  open={warningDialogOpen}
  onOpenChange={setWarningDialogOpen}
  onConfirm={handleConfirm}
  userName="John Doe"
  currentStatus="banned"
  newStatus="active"
  isLoading={isProcessing}
/>

// Suspend user - automatically uses yellow theme and suspension messaging
<UserStatusWarningDialog
  open={warningDialogOpen}
  onOpenChange={setWarningDialogOpen}
  onConfirm={handleConfirm}
  userName="John Doe"
  currentStatus="active"
  newStatus="suspended"
  isLoading={isProcessing}
/>
```

#### Custom Status Configuration
```tsx
<UserStatusWarningDialog
  open={warningDialogOpen}
  onOpenChange={setWarningDialogOpen}
  onConfirm={handleConfirm}
  userName="John Doe"
  currentStatus="active"
  newStatus="verified"
  statusConfig={{
    verified: {
      title: "Verify User Account",
      description: `Are you sure you want to verify "${userName}"? This will:
• Grant verified user privileges
• Enable premium features
• Add verification badge to profile`,
      confirmText: "Verify Account",
      color: "success"
    }
  }}
  isLoading={isProcessing}
/>
```

#### Custom Override Example
```tsx
<UserStatusWarningDialog
  open={warningDialogOpen}
  onOpenChange={setWarningDialogOpen}
  onConfirm={handleConfirm}
  userName="John Doe"
  currentStatus="active"
  newStatus="banned"
  customTitle="Suspend User Account"
  customDescription="This will temporarily suspend John Doe's account due to policy violation. They will not be able to access any features until manually reactivated."
  customConfirmText="Suspend Account"
  isLoading={isProcessing}
/>
```

#### Unknown Status with Default Theme
```tsx
<UserStatusWarningDialog
  open={warningDialogOpen}
  onOpenChange={setWarningDialogOpen}
  onConfirm={handleConfirm}
  userName="John Doe"
  currentStatus="active"
  newStatus="archived"
  actionType="warning" // Uses yellow theme for unknown status
  isLoading={isProcessing}
/>
````

```

### Props

- `open: boolean` - Controls the visibility of the dialog
- `onOpenChange: (open: boolean) => void` - Callback when dialog open state changes
- `onConfirm: () => void` - Callback when user confirms the action
- `userName: string` - Name of the user being affected
- `currentStatus: string` - Current status of the user
- `newStatus: string` - New status to be applied
- `isLoading?: boolean` - Shows loading state on confirm button
- `customDescription?: string` - Custom description text (overrides default)
- `customTitle?: string` - Custom title text (overrides default)
- `customConfirmText?: string` - Custom confirm button text (overrides default)
- `actionType?: 'danger' | 'warning' | 'success' | 'info'` - Default color theme for unknown statuses
- `statusConfig?: object` - Custom status configurations to override defaults

### Features

- **Universal Status Support**: Works with any status type (banned, active, suspended, pending, custom, etc.)
- **Smart Defaults**: Pre-configured for common statuses with appropriate colors and descriptions
- **Custom Status Configurations**: Add new status types or override existing ones
- **Dynamic Color Coding**:
  - 🔴 Red (danger) for destructive actions like ban
  - 🟡 Yellow (warning) for cautionary actions like suspend
  - 🟢 Green (success) for positive actions like activate
  - 🔵 Blue (info) for neutral actions
- **Rich Descriptions**: Detailed bullet-point descriptions explaining consequences
- **Custom Overrides**: All text can be customized via props
- **Loading state support**: Shows processing state during async operations
- **Responsive design**: Works on all screen sizes
- **Dark theme styling**: Consistent with application theme
```
