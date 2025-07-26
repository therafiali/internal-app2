import React from "react";
import UsersList from "~/components/lists/users";
import PrivateRoute from "~/components/private-route";

const users = () => {
  return (
    <PrivateRoute toDepartment="admin">
      <UsersList />
    </PrivateRoute>
  );
};

export default users;
