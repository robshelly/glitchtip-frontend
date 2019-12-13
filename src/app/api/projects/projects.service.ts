import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { baseUrl } from "../../constants";
import { ProjectNew, Project } from "./projects.interfaces";

@Injectable({
  providedIn: "root"
})
export class ProjectsService {
  private projects = new BehaviorSubject<Project[]>([]);
  getProjects = this.projects.asObservable();
  url = baseUrl + "/projects/";

  constructor(private http: HttpClient) {}

  createProject(project: ProjectNew) {
    return this.http
      .post<Project>(this.url, project)
      .pipe(tap(newProject => this.addOneProject(newProject)));
  }

  retrieveProjects() {
    return this.http
      .get<Project[]>(this.url)
      .pipe(tap(projects => this.setProjects(projects)))
      .subscribe();
  }

  retrieveProjectDetail(organizationSlug: string, projectSlug: string) {
    const url = `${this.url}${organizationSlug}/${projectSlug}/`;
    return this.http.get<Project>(url);
  }

  updateProject(
    organizationSlug: string,
    projectSlug: string,
    project: ProjectNew
  ) {
    const url = `${this.url}${organizationSlug}/${projectSlug}/`;
    return this.http.put<Project>(url, project).pipe(
      tap(_ => console.log("Post Status", _)),
      catchError(err => "error alert")
    );
  }

  deleteProject(organizationSlug: string, projectSlug: string) {
    const url = `${this.url}${organizationSlug}/${projectSlug}/`;
    console.log("delete me at: ", url);
    return this.http.delete(url).pipe(
      tap(_ => console.log("Post Status", _)),
      catchError(err => "error alert")
    );
  }

  setProjects(projects: Project[]) {
    this.projects.next(projects);
  }

  private addOneProject(project: Project) {
    const newProjects = this.projects.getValue().concat([project]);
    this.projects.next(newProjects);
  }
}
