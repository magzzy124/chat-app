export function isGroupContact(contact: Contact): contact is groupContact {
  return "groupId" in contact;
}
export function isClickableFriend(
  contact: clickableContact,
): contact is clickableFriend {
  return "friendName" in contact;
}
