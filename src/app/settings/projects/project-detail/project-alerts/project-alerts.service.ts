import { Injectable } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { HttpErrorResponse } from "@angular/common/http";
import { combineLatest, EMPTY } from "rxjs";
import {
  tap,
  map,
  mergeMap,
  take,
  catchError,
  exhaustMap,
} from "rxjs/operators";
import { OrganizationsService } from "../../../../api/organizations/organizations.service";
import { ProjectAlertsAPIService } from "../../../../api/projects/project-alerts/project-alerts.service";
import {
  AlertRecipient,
  NewAlertRecipient,
  NewProjectAlert,
  ProjectAlert,
} from "../../../../api/projects/project-alerts/project-alerts.interface";
import { ProjectSettingsService } from "../../project-settings.service";
import { StatefulService } from "src/app/shared/stateful-service/stateful-service";

interface NewAlertState {
  newAlertOpen: boolean;
  newProjectAlertRecipients: NewAlertRecipient[] | null;
  newAlertLoading: boolean;
  newAlertError: string | null;
}

interface RecipientDialogState {
  recipientError: string | null;
  recipientDialogOpen: ProjectAlert | boolean;
  activeAlert: ProjectAlert | null;
}

interface ProjectAlertState {
  initialLoad: boolean;
  initialLoadError: string | null;
  projectAlerts: ProjectAlert[] | null;
  newAlertState: NewAlertState;
  recipientDialogState: RecipientDialogState;
  // current alerts
  removeAlertLoading: number | null;
  removeAlertError: { error: string; pk: number } | null;
  updateTimespanQuantityLoading: number | null;
  updateTimespanQuantityError: { error: string; pk: number } | null;
  deleteRecipientLoading: number | null;
}

const initialNewAlertState = {
  newAlertOpen: false,
  newProjectAlertRecipients: null,
  newAlertLoading: false,
  newAlertError: null,
};

const initialRecipientDialogState = {
  recipientError: null,
  recipientDialogOpen: false,
  activeAlert: null,
};

const initialState: ProjectAlertState = {
  initialLoad: false,
  initialLoadError: null,
  projectAlerts: null,
  newAlertState: initialNewAlertState,
  recipientDialogState: initialRecipientDialogState,
  // current alerts
  removeAlertLoading: null,
  removeAlertError: null,
  updateTimespanQuantityLoading: null,
  updateTimespanQuantityError: null,
  deleteRecipientLoading: null,
};

@Injectable({
  providedIn: "root",
})
export class ProjectAlertsService extends StatefulService<ProjectAlertState> {
  readonly initialLoad$ = this.getState$.pipe(map((data) => data.initialLoad));
  readonly initialLoadError$ = this.getState$.pipe(
    map((data) => data.initialLoadError)
  );
  readonly projectAlert$ = this.getState$.pipe(
    map((data) => data.projectAlerts)
  );

  /** New Alert */
  readonly newAlertOpen$ = this.getState$.pipe(
    map((data) => data.newAlertState.newAlertOpen)
  );
  readonly newProjectAlertRecipients$ = this.getState$.pipe(
    map((data) => data.newAlertState.newProjectAlertRecipients)
  );
  readonly newAlertLoading$ = this.getState$.pipe(
    map((data) => data.newAlertState.newAlertLoading)
  );
  readonly newAlertError$ = this.getState$.pipe(
    map((data) => data.newAlertState.newAlertError)
  );

  /** Recipient Dialog */
  readonly recipientError$ = this.getState$.pipe(
    map((data) => data.recipientDialogState.recipientError)
  );
  readonly recipientDialogOpen$ = this.getState$.pipe(
    map((data) => data.recipientDialogState.recipientDialogOpen)
  );
  readonly activeAlert$ = this.getState$.pipe(
    map((data) => data.recipientDialogState.activeAlert)
  );
  readonly emailSelected$ = combineLatest([
    this.newProjectAlertRecipients$,
    this.activeAlert$,
  ]).pipe(
    map(([newRecipients, activeAlert]) => {
      if (activeAlert?.pk) {
        return activeAlert.alertRecipients.some(
          (data) => data.recipientType === "email"
        );
      } else if (newRecipients !== null) {
        return newRecipients.some((data) => data.recipientType === "email");
      }
      return;
    })
  );

  /** Current Alerts */
  readonly removeAlertLoading$ = this.getState$.pipe(
    map((data) => data.removeAlertLoading)
  );
  readonly removeAlertError$ = this.getState$.pipe(
    map((data) => data.removeAlertError)
  );
  readonly updateTimespanQuantityLoading$ = this.getState$.pipe(
    map((data) => data.updateTimespanQuantityLoading)
  );
  readonly updateTimespanQuantityError$ = this.getState$.pipe(
    map((data) => data.updateTimespanQuantityError)
  );
  readonly deleteRecipientLoading$ = this.getState$.pipe(
    map((data) => data.deleteRecipientLoading)
  );

  constructor(
    private organizationsService: OrganizationsService,
    private projectSettingsService: ProjectSettingsService,
    private projectAlertsAPIService: ProjectAlertsAPIService,
    private snackBar: MatSnackBar
  ) {
    super(initialState);
  }

  /** Actions */
  listProjectAlerts() {
    combineLatest([
      this.organizationsService.activeOrganizationSlug$,
      this.projectSettingsService.activeProjectSlug$,
    ])
      .pipe(
        take(1),
        exhaustMap(([orgSlug, projectSlug]) => {
          if (orgSlug && projectSlug) {
            return this.projectAlertsAPIService.list(orgSlug, projectSlug).pipe(
              tap((projectAlerts) => {
                this.setProjectAlertsList(projectAlerts);
              }),
              catchError((err: HttpErrorResponse) => {
                this.setProjectAlertsListError(err);
                return EMPTY;
              })
            );
          }
          return EMPTY;
        })
      )
      .subscribe();
  }

  /** New Alert Actions */
  openNewAlert() {
    this.setOpenNewAlert();
  }

  closeNewAlert() {
    this.setCloseNewAlert();
  }

  addAlertRecipient(event: NewAlertRecipient) {
    // Force https:// if no protocol exists
    if (event.url && !event.url.startsWith("http")) {
      event.url = "https://" + event.url;
    }
    combineLatest([this.newProjectAlertRecipients$, this.activeAlert$])
      .pipe(
        take(1),
        exhaustMap(([newRecipients, activeAlert]) => {
          if (newRecipients !== null) {
            this.setAddNewAlertRecipient(event);
          } else if (activeAlert?.alertRecipients !== null) {
            this.updateAlertRecipient(event);
          }
          return EMPTY;
        })
      )
      .subscribe();
  }

  removeNewAlertRecipient(url: string) {
    this.setRemoveNewAlertRecipient(url);
  }

  createNewAlert(timeQuantity: { timespan_minutes: number; quantity: number }) {
    this.setNewAlertLoading();
    combineLatest([
      this.organizationsService.activeOrganizationSlug$,
      this.projectSettingsService.activeProjectSlug$,
      this.newProjectAlertRecipients$,
    ])
      .pipe(
        take(1),
        exhaustMap(([orgSlug, projectSlug, recipients]) => {
          if (orgSlug && projectSlug && timeQuantity && recipients !== null) {
            const data: NewProjectAlert = {
              timespan_minutes: timeQuantity.timespan_minutes,
              quantity: timeQuantity.quantity,
              alertRecipients: recipients,
            };
            return this.projectAlertsAPIService
              .create(data, orgSlug, projectSlug)
              .pipe(
                tap((resp) => {
                  this.setCreateAlert(resp);
                  this.snackBar.open(`Success! Your new alert has been added.`);
                })
              );
          }
          return EMPTY;
        }),
        catchError((err: HttpErrorResponse) => {
          this.setCreateAlertError(err);
          return EMPTY;
        })
      )
      .subscribe();
  }

  /** Update Actions */
  deleteProjectAlert(pk: number) {
    this.setDeleteAlertLoading(pk);
    combineLatest([
      this.organizationsService.activeOrganizationSlug$,
      this.projectSettingsService.activeProjectSlug$,
    ])
      .pipe(
        take(1),
        mergeMap(([orgSlug, projectSlug]) => {
          if (orgSlug && projectSlug) {
            return this.projectAlertsAPIService
              .destroy(pk.toString(), orgSlug, projectSlug)
              .pipe(
                tap((_) => {
                  this.setDeleteProjectAlert(pk);
                  this.snackBar.open(`Success: Your alert has been deleted`);
                })
              );
          }
          return EMPTY;
        }),
        catchError((err: HttpErrorResponse) => {
          this.setDeleteAlertError(err, pk);
          return EMPTY;
        })
      )
      .subscribe();
  }

  updateTimespanQuantity(
    newTimespan: number,
    newQuantity: number,
    id: number,
    recipients: AlertRecipient[]
  ) {
    this.setUpdateTimespanQuantityLoading(id);
    const data: ProjectAlert = {
      pk: id,
      timespan_minutes: newTimespan,
      quantity: newQuantity,
      alertRecipients: recipients,
    };
    combineLatest([
      this.organizationsService.activeOrganizationSlug$,
      this.projectSettingsService.activeProjectSlug$,
    ])
      .pipe(
        take(1),
        mergeMap(([orgSlug, projectSlug]) => {
          if (orgSlug && projectSlug) {
            return this.projectAlertsAPIService
              .update(id.toString(), data, orgSlug, projectSlug)
              .pipe(
                tap((resp) => {
                  this.setUpdateTimespanQuantity(resp);
                  this.snackBar.open(`Success: Your alert has been updated`);
                })
              );
          }
          return EMPTY;
        }),
        catchError((err: HttpErrorResponse) => {
          this.setUpdateTimespanQuantityError(err, id);
          return EMPTY;
        })
      )
      .subscribe();
  }

  updateAlertRecipient(newRecipient: NewAlertRecipient) {
    let activeErrorPk = 0;
    combineLatest([
      this.activeAlert$,
      this.organizationsService.activeOrganizationSlug$,
      this.projectSettingsService.activeProjectSlug$,
    ])
      .pipe(
        take(1),
        exhaustMap(([activeAlert, orgSlug, projectSlug]) => {
          if (activeAlert && orgSlug && projectSlug) {
            activeErrorPk = activeAlert.pk;
            const recipientsWithoutPK: NewAlertRecipient[] = activeAlert.alertRecipients
              .map((recipient) => {
                return {
                  recipientType: recipient.recipientType,
                  url: recipient.url,
                };
              })
              .concat([newRecipient]);
            const data = {
              timespan_minutes: activeAlert.timespan_minutes,
              quantity: activeAlert.quantity,
              alertRecipients: recipientsWithoutPK,
            };
            return this.projectAlertsAPIService
              .update(activeAlert.pk.toString(), data, orgSlug, projectSlug)
              .pipe(
                tap((resp) => {
                  this.setUpdateAlertRecipients(resp.alertRecipients, resp.pk);
                  this.snackBar.open(`Success: Your alert has been updated`);
                })
              );
          }
          return EMPTY;
        }),
        catchError((err: HttpErrorResponse) => {
          this.setUpdateAlertRecipientsError(err, activeErrorPk);
          return EMPTY;
        })
      )
      .subscribe();
  }

  deleteAlertRecipient(recipientToRemove: AlertRecipient, alert: ProjectAlert) {
    this.setDeleteRecipientLoading(recipientToRemove.pk);
    const data = {
      ...alert,
      alertRecipients: alert.alertRecipients.filter(
        (currentRecipient) => currentRecipient.pk !== recipientToRemove.pk
      ),
    };
    combineLatest([
      this.organizationsService.activeOrganizationSlug$,
      this.projectSettingsService.activeProjectSlug$,
    ])
      .pipe(
        take(1),
        mergeMap(([orgSlug, projectSlug]) => {
          if (orgSlug && projectSlug) {
            return this.projectAlertsAPIService
              .update(alert.pk.toString(), data, orgSlug, projectSlug)
              .pipe(
                tap((resp) => {
                  this.setUpdateAlertRecipients(resp.alertRecipients, resp.pk);
                  this.snackBar.open(
                    `Success: Your recipient has been deleted`
                  );
                })
              );
          }
          return EMPTY;
        }),
        catchError((err: HttpErrorResponse) => {
          this.setDeleteRecipientError(err);
          return EMPTY;
        })
      )
      .subscribe();
  }

  openUpdateRecipientDialog(alert: ProjectAlert) {
    this.setOpenUpdateRecipientDialog(alert);
  }

  openCreateRecipientDialog() {
    this.setOpenCreateRecipientDialog();
  }

  closeRecipientDialog() {
    this.setCloseRecipientDialog();
  }

  /** Set state */

  private setProjectAlertsList(alerts: ProjectAlert[]) {
    this.setState({
      projectAlerts: alerts,
      initialLoad: true,
      initialLoadError: null,
    });
  }

  private setProjectAlertsListError(err: HttpErrorResponse) {
    this.setState({
      initialLoad: true,
      initialLoadError: `There was an error loading your alerts. Try refreshing the page.`,
    });
  }

  /** New Alert */

  private setOpenNewAlert() {
    const newAlertState = this.state.getValue().newAlertState;
    this.setState({
      newAlertState: {
        ...newAlertState,
        newAlertOpen: true,
        newProjectAlertRecipients: [{ recipientType: "email", url: "" }],
      },
    });
  }

  private setCloseNewAlert() {
    const newAlertState = this.state.getValue().newAlertState;
    this.setState({
      newAlertState: {
        ...newAlertState,
        newAlertOpen: false,
        newAlertError: null,
        newProjectAlertRecipients: null,
      },
    });
  }

  private setAddNewAlertRecipient(recipient: NewAlertRecipient) {
    const newAlertState = this.state.getValue().newAlertState;
    const recipientDialogState = this.state.getValue().recipientDialogState;
    this.setState({
      newAlertState: {
        ...newAlertState,
        newProjectAlertRecipients:
          newAlertState.newProjectAlertRecipients?.concat([recipient]) ?? null,
      },
      recipientDialogState: {
        ...recipientDialogState,
        recipientDialogOpen: false,
      },
    });
  }

  private setRemoveNewAlertRecipient(url: string) {
    const newAlertState = this.state.getValue().newAlertState;
    this.setState({
      newAlertState: {
        ...newAlertState,
        newProjectAlertRecipients:
          newAlertState.newProjectAlertRecipients?.filter(
            (recipient) => recipient.url !== url
          ) ?? null,
      },
    });
  }

  private setNewAlertLoading() {
    const newAlertState = this.state.getValue().newAlertState;
    this.setState({
      newAlertState: {
        ...newAlertState,
        newAlertLoading: true,
      },
    });
  }

  private setCreateAlert(alert: ProjectAlert) {
    const state = this.state.getValue();
    this.setState({
      projectAlerts: state.projectAlerts?.concat([alert]),
      newAlertState: initialNewAlertState,
    });
  }

  private setCreateAlertError(error: HttpErrorResponse) {
    const newAlertState = this.state.getValue().newAlertState;
    this.setState({
      newAlertState: {
        ...newAlertState,
        newAlertError: `${error.statusText} : ${error.status}`,
        newAlertLoading: false,
      },
    });
  }

  private setOpenCreateRecipientDialog() {
    const recipientDialogState = this.state.getValue().recipientDialogState;
    this.setState({
      recipientDialogState: {
        ...recipientDialogState,
        recipientDialogOpen: true,
        activeAlert: null,
      },
    });
  }

  /** Recipient Dialog */

  private setCloseRecipientDialog() {
    const recipientDialogState = this.state.getValue().recipientDialogState;
    this.setState({
      recipientDialogState: {
        ...recipientDialogState,
        recipientDialogOpen: false,
        activeAlert: null,
      },
    });
  }

  private setOpenUpdateRecipientDialog(alert: ProjectAlert) {
    const recipientDialogState = this.state.getValue().recipientDialogState;
    this.setState({
      recipientDialogState: {
        ...recipientDialogState,
        recipientDialogOpen: true,
        activeAlert: alert,
      },
    });
  }

  /** Alert Updates */

  private setDeleteAlertLoading(pk: number) {
    this.setState({
      removeAlertLoading: pk,
      removeAlertError: null,
    });
  }

  private setDeleteProjectAlert(pk: number) {
    const state = this.state.getValue();
    this.setState({
      projectAlerts:
        state.projectAlerts?.filter((alert) => alert.pk !== pk) ?? null,
      removeAlertLoading: null,
      removeAlertError: null,
    });
  }

  private setDeleteAlertError(err: HttpErrorResponse, id: number) {
    const state = this.state.getValue();
    this.setState({
      removeAlertError: {
        ...state.removeAlertError,
        error: `${err.statusText} : ${err.status}`,
        pk: id,
      },
      removeAlertLoading: null,
    });
  }

  private setUpdateTimespanQuantity(updatedAlert: ProjectAlert) {
    const state = this.state.getValue();
    this.setState({
      projectAlerts: this.findAndReplaceAlert(
        state.projectAlerts,
        updatedAlert
      ),
      updateTimespanQuantityLoading: null,
      updateTimespanQuantityError: null,
    });
  }

  private setUpdateTimespanQuantityLoading(pk: number) {
    this.setState({
      updateTimespanQuantityLoading: pk,
      updateTimespanQuantityError: null,
    });
  }

  private setUpdateTimespanQuantityError(err: HttpErrorResponse, id: number) {
    const state = this.state.getValue();
    this.setState({
      updateTimespanQuantityLoading: null,
      updateTimespanQuantityError: {
        ...state.updateTimespanQuantityError,
        error: `${err.statusText} : ${err.status}`,
        pk: id,
      },
    });
  }

  private setUpdateAlertRecipientsError(err: HttpErrorResponse, id: number) {
    const recipientDialogState = this.state.getValue().recipientDialogState;
    this.setState({
      recipientDialogState: {
        ...recipientDialogState,
        recipientError: `${err.statusText} : ${err.status}`,
      },
    });
  }

  private setUpdateAlertRecipients(recipients: AlertRecipient[], id: number) {
    const state = this.state.getValue();
    const recipientDialogState = this.state.getValue().recipientDialogState;
    this.setState({
      projectAlerts: state.projectAlerts?.map((alert) =>
        alert.pk === id ? { ...alert, alertRecipients: recipients } : alert
      ),
      recipientDialogState: {
        ...recipientDialogState,
        recipientError: null,
        recipientDialogOpen: false,
        activeAlert: null,
      },
      deleteRecipientLoading: null,
    });

    this.setState({});
  }

  private setDeleteRecipientLoading(pk: number) {
    const recipientDialogState = this.state.getValue().recipientDialogState;
    this.setState({
      recipientDialogState: {
        ...recipientDialogState,
        recipientError: null,
      },
      deleteRecipientLoading: pk,
    });

    this.setState({});
  }

  private setDeleteRecipientError(err: HttpErrorResponse) {
    const recipientDialogState = this.state.getValue().recipientDialogState;
    this.setState({
      recipientDialogState: {
        ...recipientDialogState,
        recipientError: `${err.statusText} : ${err.status}`,
      },
      deleteRecipientLoading: null,
    });
  }

  /** Utility Functions */

  findAndReplaceAlert(
    currentAlerts: ProjectAlert[] | null,
    newAlert: ProjectAlert
  ): ProjectAlert[] | null {
    const updatedAlert = currentAlerts?.map((alert) => {
      if (alert.pk === newAlert.pk) {
        return {
          ...alert,
          timespan_minutes: newAlert.timespan_minutes,
          quantity: newAlert.quantity,
        };
      } else return alert;
    });
    return updatedAlert !== undefined ? updatedAlert : null;
  }
}
