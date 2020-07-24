import { Component, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { ActivatedRoute, Router, ParamMap } from "@angular/router";
import { HttpErrorResponse } from "@angular/common/http";
import { EMPTY } from "rxjs";
import { map, catchError, tap } from "rxjs/operators";
import { GlitchTipOAuthService } from "../api/oauth/oauth.service";
import { AuthService } from "../api/auth/auth.service";

@Component({
  selector: "app-auth",
  templateUrl: "./auth.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent implements OnInit {
  provider$ = this.route.params.pipe(map((params) => params.provider));
  isLoggedIn = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private oauthService: GlitchTipOAuthService,
    private authService: AuthService
  ) {
    authService.isLoggedIn.subscribe(
      (isLoggedIn) => (this.isLoggedIn = isLoggedIn)
    );
  }

  ngOnInit(): void {
    const provider: string | undefined = this.route.snapshot.params.provider;
    const fragment = this.route.snapshot.fragment;
    const query = this.route.snapshot.queryParamMap;
    if (provider) {
      this.attemptOAuthLogin(provider, fragment, query);
    } else {
      this.notEnoughQueryData();
    }
  }

  private attemptOAuthLogin(
    provider: string,
    fragment: string,
    query: ParamMap
  ) {
    // Various services return tokens in slightly different ways
    if (fragment) {
      const accessToken = new URLSearchParams(fragment).get("access_token");
      if (accessToken) {
        if (provider === "gitlab") {
          this.oauthService
            .gitlabLogin(accessToken, this.isLoggedIn)
            .pipe(
              tap(() => this.loginSuccess()),
              catchError((error: HttpErrorResponse) => {
                this.processSocialAuthErrorResponse(error);
                return EMPTY;
              })
            )
            .toPromise();
        } else if (provider === "google") {
          this.oauthService
            .googleLogin(accessToken, this.isLoggedIn)
            .pipe(
              tap(() => this.loginSuccess()),
              catchError((error: HttpErrorResponse) => {
                this.processSocialAuthErrorResponse(error);
                return EMPTY;
              })
            )
            .toPromise();
        } else if (provider === "microsoft") {
          this.oauthService
            .microsoftLogin(accessToken, this.isLoggedIn)
            .pipe(
              tap(() => this.loginSuccess()),
              catchError((error: HttpErrorResponse) => {
                this.processSocialAuthErrorResponse(error);
                return EMPTY;
              })
            )
            .toPromise();
        }
      }
    } else if (query) {
      const code = query.get("code");
      if (code) {
        if (provider === "github") {
          this.oauthService
            .githubLogin(code, this.isLoggedIn)
            .pipe(
              tap(() => this.loginSuccess()),
              catchError((error: HttpErrorResponse) => {
                this.processSocialAuthErrorResponse(error);
                return EMPTY;
              })
            )
            .toPromise();
        }
      }
    } else {
      this.notEnoughQueryData();
    }
  }

  private processSocialAuthErrorResponse(error: HttpErrorResponse) {
    if (error.status === 400) {
      // this.error = error.error.non_field_errors;
    }
  }

  /** Not enough data to even try auth...just navigate home */
  private notEnoughQueryData() {
    this.router.navigate([]);
  }

  /** On success for any oauth client, set auth data and redirect to home */
  private loginSuccess() {
    if (this.isLoggedIn) {
      this.router.navigate(["profile"]);
    } else {
      this.authService.setAuth({ isLoggedIn: true });
      this.router.navigate([""]);
    }
  }
}