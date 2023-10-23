Étant donné une matrice d'entiers, écrire un programme qui affiche le numéro de la ligne qui ne contient que des valeurs nulles.


Version avec GOTO
```shell
for i := 1 to n
do begin
  for j := 1 to n do
    if x[i, j] <> 0
    then goto reject;

  writeln('The first all-zero row is', i);
  break;

reject: 

end;
```

Version sans GOTO
```
i:=1;
repeat
    j := 1;
    allzero := true;
    while ( j<=n ) and allzero
        do begin
        if x[i, j] <> 0
            then allzero := false;
        j += j+1 ;
        end;
        i := i + 1;
until (i>n) or allzero;
if i<= n
    then writeln ('The first all-zero row is', i-1 );
```