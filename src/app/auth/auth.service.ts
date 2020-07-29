import { Injectable } from '@angular/core';
import { AuthData } from './auth-data.model';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { AngularFireAuth } from 'angularfire2/auth';
import { TrainingService } from '../training/training.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UIService } from '../shared/ui.service';

@Injectable()

export class AuthService {
  authChanged = new Subject<boolean>();
  private isAuthenticated = false;

  constructor(private router: Router, private afAuth: AngularFireAuth, private trainingService: TrainingService, private snackBar: MatSnackBar, private uiService: UIService) {}

  initAuthListener() {
    this.afAuth.authState
      .subscribe(user => {
        if (user) {
          this.isAuthenticated = true;
          this.authChanged.next(true);
          this.router.navigate(['/training'])
        } else {
          this.trainingService.cancelSubscription();
          this.isAuthenticated = false;
          this.authChanged.next(false);
          this.router.navigate(['/login'])
        }
      })
  }

  registerUser(authData: AuthData) {
    this.uiService.loadingStateChanged.next(true);
   this.afAuth.auth.createUserWithEmailAndPassword(
     authData.email,
     authData.password
     ).then(result => {
      this.uiService.loadingStateChanged.next(false);
      this.uiService.showSnackBar('Success', null, 5000)
     }).catch(error => {
       this.uiService.loadingStateChanged.next(false);
       this.uiService.showSnackBar(error.message, null, 5000)
     })
  }

  login(authData: AuthData) {
    this.uiService.loadingStateChanged.next(true);
    this.afAuth.auth.signInWithEmailAndPassword(
      authData.email,
      authData.password
      ).then(result => {
        this.uiService.loadingStateChanged.next(false);
        this.snackBar.open('Success!', null, {
          duration: 5000
        })
      }).catch(error => {
        this.uiService.loadingStateChanged.next(false);
        this.uiService.showSnackBar(error.message, null, 5000)
      })
  }

  logout() {
    this.afAuth.auth.signOut();
  }

  isAuth() {
    return this.isAuthenticated;
  }
}
