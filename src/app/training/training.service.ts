import { Exercise } from "./exercise.model";
import { Injectable } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { AngularFirestore } from 'angularfire2/firestore';
import { map } from 'rxjs/operators';
import { UIService } from '../shared/ui.service';

@Injectable()

export class TrainingService {
  loadingSpinner = new Subject<boolean>();
  private fbSubscription: Subscription[] = [];
  exerciseChanged = new Subject<Exercise>();
  exercisesChanged = new Subject<Exercise[]>();
  finishedExercisesChanged = new Subject<Exercise[]>();
  private availableExercises: Exercise[] = [];
  private runningExercise: Exercise;

  constructor(private angularFire: AngularFirestore, private uiService: UIService) {}

  fetchExercises() {
    this.fbSubscription.push(this.angularFire.collection('availableExercises').snapshotChanges()
      .pipe(map(docArray => {
        return docArray.map(doc => {
          return {
            id: doc.payload.doc.id,
            name: doc.payload.doc.data()['name'],
            duration: doc.payload.doc.data()['duration'],
            calories: doc.payload.doc.data()['calories']
          }
        })
      }))
      .subscribe((exercises: Exercise[]) => {
        this.availableExercises = exercises;
        this.exercisesChanged.next([...this.availableExercises]);
        this.uiService.loadingStateChanged.next(false);
      }, error => {
        this.uiService.loadingStateChanged.next(false);
        this.uiService.showSnackBar('Fetching exercises failed, please try again later', null, 5000);
        this.exerciseChanged.next(null);
      }));
  }

  startExercise(selectedId: string) {
    //this.angularFire.doc('availableExercises/' + selectedId).update({lastSelected: new Date()})
    this.runningExercise = this.availableExercises.find(ex => ex.id === selectedId);
    this.exerciseChanged.next({...this.runningExercise});
  }

  getRunningExercise() {
    return { ...this.runningExercise };
  }

  completeExercise() {
    this.addDataToDataBase({...this.runningExercise, date: new Date(), state: 'completed'});
    this.runningExercise = null;
    this.exerciseChanged.next(null);
  }

  cancelExercise(progress: number) {
    this.addDataToDataBase({...this.runningExercise, duration: this.runningExercise.duration * (progress / 100), calories: this.runningExercise.calories * (progress / 100), date: new Date(), state: 'cancelled'});
    this.runningExercise = null;
    this.exerciseChanged.next(null);
  }

  fetchCompletedorCanceledExercises() {
    this.fbSubscription.push(this.angularFire.collection('finishedExercises').valueChanges()
      .subscribe(
        (exercises: Exercise[]) => {
      this.finishedExercisesChanged.next(exercises);
    }))
  }

  cancelSubscription() {
    this.fbSubscription.forEach(sub => sub.unsubscribe());
  }

  private addDataToDataBase(exercise: Exercise) {
    this.angularFire.collection('finishedExercises').add(exercise);
  }
}
