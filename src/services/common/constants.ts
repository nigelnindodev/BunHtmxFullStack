/**
 * Contains commands that will trigger actions on the front end once an API request has been completed.
 */
export enum ServerHxTriggerEvents {
  LOGIN_STATUS_CHANGE = "loginStatusChangeEvent",
  GENERAL_ERROR = "generalErrorEvent",
  REFRESH_ORDER = "refreshOrderEvent",
}
