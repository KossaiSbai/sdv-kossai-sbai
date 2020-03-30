## Welcome to GitHub Pages

You can use the [editor on GitHub](https://github.com/KossaiSbai/sdv-kossai-sbai/edit/master/README.md) to maintain and preview the content for your website in Markdown files.

Whenever you commit to this repository, GitHub Pages will run [Jekyll](https://jekyllrb.com/) to rebuild the pages in your site, from the content in your Markdown files.

## Introduction
The purpose of this proposal is to provide a data visualisation that will give a better insight on European football, in particular be able to assess teams performances. In fact, football is a low- scoring sport: the overall average number of goals scored per game at the FIFA World Cups between 1930 and 2018, is 3.08. This shows us that we cannot evaluate a teams’ performance on the number of goals scored. It is important to be able to judge how well a team did on given games: it enables the club to improve team strategies and hopefully increase number of won games. 
Therefore, we can ask ourselves: what are appropriate metrics to use in order to get a reliable measure of the performance of a team? Can analysing the game style of a team help us explain why it might have done better/worse on a given season/game? 

The dataset [1] that will be used, in order to answer those questions contains statistical summary data by the end of each season from 2014 for 6 UEFA Leagues: La Liga, Ligue 1, EPL, Bundesliga, Serie A and RFPL. It is made up of two CSV files: the first one displays summary data per season for all the teams whereas the second one displays similar data per game for all the teams. 

## Litterature review 
Researchers in the football statistics field have been coming up with different parameters in order to evaluate teams and players performance. For instance, historical-based approaches use past victories, defeats to both assess a team and predict future performance. One drawback of this approach is that teams change over time : incoming and outcoming transfers change the team’s roster and the given club might get different coaches to manage the team, who will most likely adopt different strategies in the games.

The “expected goals” (xG) metric along with others of them will be used in this visualisation, as as parameters assessing a team’s performance . 
However what is xG metric? 
xG tells us how likely it is that a shot would have  resulted in a goal. 
Sam Green wrote about the “expected goals” metric (xG) in [2]. In there, using OptaPro data collection, he came up with a model that aims to determine "a shot’s probability of being on target and/or scored.” He also states that not only this metric can be useful for offensive perspective but
also enables us to defend “key areas of the pitch” and eventually concede less goals. 
Finally, Rathke Alex in [3], uses an Xg model taking other parameters such as, distance of the shot from the goal,  to investigate about goal scoring in PL and Bundesliga 2012-2013 season, in particular assessing strikers’ performances. He concludes by stressing the reliability of this metric: he states that “could be incorporated into training exercises (attacking and defensive) to aid player’s understanding and needs of the game”.

## Interactive visualizations.
The proposed website contains 5 visualizations. 
1. Table
\
\
![Table](website_images/sdv_table.png). 
2. Line chart 
![Line chart](website_images/Line chart.jpg). 
3. Area chart 
![Area chart](website_images/Area chart.png).  
4. Stacked bar chart
![Stacked bar chart](website_images/Bar chart.png).  
5. Scatter plot
![Area chart](website_images/Scatter plot.png).  
```markdown
Syntax highlighted code block

# Header 1
## Header 2
### Header 3

- Bulleted
- List

1. Numbered
2. List

**Bold** and _Italic_ and `Code` text

[Link](url) and ![Image](src)
```

For more details see [GitHub Flavored Markdown](https://guides.github.com/features/mastering-markdown/).

### Jekyll Themes

Your Pages site will use the layout and styles from the Jekyll theme you have selected in your [repository settings](https://github.com/KossaiSbai/sdv-kossai-sbai/settings). The name of this theme is saved in the Jekyll `_config.yml` configuration file.

### Support or Contact

Having trouble with Pages? Check out our [documentation](https://help.github.com/categories/github-pages-basics/) or [contact support](https://github.com/contact) and we’ll help you sort it out.
