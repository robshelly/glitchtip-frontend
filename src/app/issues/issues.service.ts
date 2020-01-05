import { Injectable } from "@angular/core";
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse
} from "@angular/common/http";
import { MatSnackBar } from "@angular/material/snack-bar";
import { BehaviorSubject, combineLatest, Observable, EMPTY } from "rxjs";
import { tap, catchError, map } from "rxjs/operators";
import {
  Issue,
  IssueWithSelected,
  IssueStatus,
  UpdateStatusResponse,
  RetrieveIssuesParams
} from "./interfaces";
import { baseUrl } from "../constants";

interface IssuesState {
  issues: Issue[];
  selectedIssues: number[];
  issueCount: number | null;
  page: number | null;
  nextPage: string | null;
  previousPage: string | null;
}

const initialState: IssuesState = {
  issues: [],
  selectedIssues: [],
  issueCount: null,
  page: null,
  nextPage: null,
  previousPage: null
};

@Injectable({
  providedIn: "root"
})
export class IssuesService {
  private issuesState = new BehaviorSubject<IssuesState>(initialState);
  private getState$ = this.issuesState.asObservable();
  private url = baseUrl + "/issues/";

  issues$ = this.getState$.pipe(map(state => state.issues));
  selectedIssues$ = this.getState$.pipe(map(state => state.selectedIssues));
  issuesWithSelected$: Observable<IssueWithSelected[]> = combineLatest(
    this.issues$,
    this.selectedIssues$
  ).pipe(
    map(([issues, selectedIssues]) =>
      issues.map(issue => ({
        ...issue,
        isSelected: selectedIssues.includes(issue.id) ? true : false
      }))
    )
  );
  areAllSelected$ = combineLatest(this.issues$, this.selectedIssues$).pipe(
    map(([issues, selectedIssues]) => issues.length === selectedIssues.length)
  );
  issueCount$ = this.getState$.pipe(map(state => state.issueCount));
  hasNextPage$ = this.getState$.pipe(map(state => state.nextPage !== null));
  hasPreviousPage$ = this.getState$.pipe(
    map(state => state.previousPage !== null)
  );
  nextPageParams$ = this.getState$.pipe(
    map(state => this.urlParamsToObject(state.nextPage))
  );
  previousPageParams$ = this.getState$.pipe(
    map(state => this.urlParamsToObject(state.previousPage))
  );

  constructor(private http: HttpClient, private snackbar: MatSnackBar) {}

  urlParamsToObject(url: string | null) {
    return url
      ? this.paramsToObject(new URLSearchParams(url.split("?")[1]))
      : null;
  }

  paramsToObject(entries) {
    const result = {};
    for (const entry of entries) {
      // each 'entry' is a [key, value] tuple
      const [key, value] = entry;
      result[key] = value;
    }
    return result;
  }

  getNextPage() {
    const nextPage = this.issuesState.getValue().nextPage;
    if (nextPage) {
      this.retrieveIssues(nextPage).toPromise();
    }
  }

  getPreviousPage() {
    const previousPage = this.issuesState.getValue().previousPage;
    if (previousPage) {
      this.retrieveIssues(previousPage).toPromise();
    }
  }

  getIssues(params: RetrieveIssuesParams) {
    return this.retrieveIssues(this.url, params);
  }

  toggleSelected(issueId: number) {
    const state = this.issuesState.getValue();
    let selectedIssues: number[];
    if (state.selectedIssues.includes(issueId)) {
      selectedIssues = state.selectedIssues.filter(issue => issue !== issueId);
    } else {
      selectedIssues = state.selectedIssues.concat([issueId]);
    }
    this.issuesState.next({ ...state, selectedIssues });
  }

  toggleSelectAll() {
    const state = this.issuesState.getValue();
    if (state.issues.length === state.selectedIssues.length) {
      this.issuesState.next({
        ...state,
        selectedIssues: []
      });
    } else {
      this.issuesState.next({
        ...state,
        selectedIssues: state.issues.map(issue => issue.id)
      });
    }
  }

  bulkSetStatus(status: IssueStatus) {
    const selectedIssues = this.issuesState.getValue().selectedIssues;
    return this.updateStatus(selectedIssues, status).toPromise();
  }

  // Not private for testing purposes
  retrieveIssues(url: string, params?: RetrieveIssuesParams) {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        httpParams = httpParams.append(key, params[key]);
      });
    }
    return this.http
      .get<Issue[]>(url, { observe: "response", params: httpParams })
      .pipe(
        tap(resp => {
          const linkHeader = resp.headers.get("link");
          if (resp.body && linkHeader) {
            this.setIssues(resp.body);
            this.setPagination(linkHeader);
          }
        })
      );
  }

  clearState() {
    this.issuesState.next(initialState);
  }

  private updateStatus(ids: number[], status: IssueStatus) {
    const params = {
      id: ids.map(id => id.toString())
    };
    const data = {
      status
    };
    return this.http
      .put<UpdateStatusResponse>(this.url, data, { params })
      .pipe(
        tap(resp => this.setIssueStatuses(ids, resp.status)),
        catchError((err: HttpErrorResponse) => {
          console.log(err);
          this.snackbar.open("Error, unable to update issue");
          return EMPTY;
        })
      );
  }

  private setIssueStatuses(issueIds: number[], status: IssueStatus) {
    const state = this.issuesState.getValue();
    this.issuesState.next({
      ...state,
      issues: state.issues.map(issue =>
        issueIds.includes(issue.id) ? { ...issue, status } : issue
      ),
      selectedIssues: []
    });
  }

  private setIssues(issues: Issue[]) {
    this.issuesState.next({ ...this.issuesState.getValue(), issues });
  }

  /**
   * Pagination info exists in a header, parse it out and store it.
   * Anything with an actual link indicates it has results. This differs just
   * very slightly from sentry open source.
   */
  private setPagination(linkHeader: string) {
    const parts: { [key: string]: string } = linkHeader
      .split(",")
      .reduce((acc, link) => {
        const match = link.match(/<(.*)>; rel="(\w*)"/);
        if (match) {
          const url = match[1];
          const rel = match[2];
          acc[rel] = url;
          return acc;
        }
        return "";
      }, {});
    this.issuesState.next({
      ...this.issuesState.getValue(),
      nextPage: parts.next ? parts.next : null,
      previousPage: parts.prev ? parts.prev : null
    });
  }
}
